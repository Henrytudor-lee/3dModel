'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useSceneStore, SceneObject } from '@/stores/sceneStore';
import { useI18n } from '@/i18n';

interface ParsedObject {
  type: 'box' | 'sphere' | 'cylinder' | 'prism';
  name: string;
  geometry: Record<string, number>;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  material: {
    color: string;
    opacity: number;
    type: 'standard' | 'metal' | 'glass' | 'emissive';
    wireframe: boolean;
  };
}

interface ParsedResponse {
  action: string;
  object?: ParsedObject;
  target?: string;
  targets?: string[];
  updates?: {
    transform?: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    };
    material?: {
      color?: string;
      opacity?: number;
      type?: 'standard' | 'metal' | 'glass' | 'emissive';
      wireframe?: boolean;
    };
    geometry?: Record<string, number>;
    visible?: boolean;
  };
  operation?: 'union' | 'intersect' | 'subtract';
  filter?: { color?: string };
  message?: string;
  reasoning?: string;
  // For complex/carve action
  subAction?: string;
  baseObject?: ParsedObject;
  cutObject?: {
    type: 'box' | 'sphere' | 'cylinder' | 'prism';
    name?: string;
    geometry: Record<string, number>;
    transform?: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    };
  };
}

interface MessageState {
  expanded: boolean;
}

const EXAMPLE_PROMPTS = [
  'Create a red metal cube with size 2',
  'Add a blue sphere with radius 3',
  'Make a yellow cylinder, height 5, radius 1',
  'Create a green prism with 6 sides',
  'Add a white glass sphere',
  'Make a dark gray metal box',
  'Create an emissive orange cube',
  'Add a transparent blue cylinder',
  'Create a cyan cylinder with radius 2 and height 4',
  'Make a purple metallic sphere',
];

export default function AiChatPanel() {
  const { t } = useI18n();
  const { isOpen, messages, isLoading, closeChat, addMessage, setLoading, setError } = useChatStore();
  const sceneStore = useSceneStore();
  const { addObject } = sceneStore;
  const [input, setInput] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({});
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const parseAIResponse = (content: string): ParsedResponse | null => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });

    setLoading(true);
    setError(null);

    try {
      // Get current messages from store (including the one we just added)
      const currentMessages = useChatStore.getState().messages;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiContent = data.response;

      // Progressive streaming effect - reveal content in chunks
      addMessage({ role: 'assistant', content: '' });

      // Get the id of the message we just added
      const messages = useChatStore.getState().messages;
      const tempMessageId = messages[messages.length - 1]?.id;
      if (!tempMessageId) {
        // Fallback: add message with full content immediately
        useChatStore.setState(state => ({
          messages: state.messages.map((m, i) =>
            i === messages.length - 1 ? { ...m, content: aiContent } : m
          ),
        }));
      } else {
        const chunkSize = 3; // characters per chunk
        const delay = 15; // ms between chunks

        for (let i = 0; i <= aiContent.length; i += chunkSize) {
          const chunk = aiContent.slice(0, i);
          setStreamingContent(prev => ({ ...prev, [tempMessageId]: chunk }));
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        setStreamingContent(prev => {
          const newState = { ...prev };
          delete newState[tempMessageId];
          return newState;
        });

        // Update the message with full content
        useChatStore.setState(state => ({
          messages: state.messages.map(m =>
            m.id === tempMessageId ? { ...m, content: aiContent } : m
          ),
        }));
      }

      // Try to parse and execute actions
      const parsed = parseAIResponse(aiContent);
      const objects = useSceneStore.getState().objects;

      // Helper to find objects by name (partial matching)
      const findObjectByName = (name: string) => {
        return objects.find(o => o.name.toLowerCase().includes(name.toLowerCase()));
      };

      // Helper to find all objects matching filter
      const findObjectsByFilter = (filter: { color?: string }) => {
        return objects.filter(o => {
          if (filter.color && o.material.color.toLowerCase() === filter.color.toLowerCase()) {
            return true;
          }
          return false;
        });
      };

      if (parsed) {
        let responseMessage = '';

        switch (parsed.action) {
          case 'create':
            if (parsed.object) {
              const obj = parsed.object;
              // Add _AI suffix and handle duplicate names
              let baseName = obj.name.replace(/(_AI)?(_?\d*)$/, '');
              baseName = `${baseName}_AI`;

              let finalName = baseName;
              let counter = 1;
              while (objects.some(o => o.name === finalName)) {
                finalName = `${baseName}_${counter}`;
                counter++;
              }

              addObject(
                {
                  id: crypto.randomUUID(),
                  name: finalName,
                  type: obj.type,
                  geometry: obj.geometry,
                  transform: obj.transform,
                  material: obj.material,
                  visible: true,
                  children: [],
                },
                `Create ${finalName} via AI`
              );
              responseMessage = `I've created a ${finalName} for you in the scene! You can adjust its properties in the right panel.`;
            }
            break;

          case 'modify':
            if (parsed.target && parsed.updates) {
              const targetObj = findObjectByName(parsed.target);
              if (targetObj) {
                // Build the updates object with proper typing
                const updatePayload: Partial<SceneObject> = {};
                if (parsed.updates.transform) {
                  updatePayload.transform = {
                    position: parsed.updates.transform.position ?? targetObj.transform.position,
                    rotation: parsed.updates.transform.rotation ?? targetObj.transform.rotation,
                    scale: parsed.updates.transform.scale ?? targetObj.transform.scale,
                  };
                }
                if (parsed.updates.material) {
                  updatePayload.material = {
                    color: parsed.updates.material.color ?? targetObj.material.color,
                    opacity: parsed.updates.material.opacity ?? targetObj.material.opacity,
                    type: parsed.updates.material.type ?? targetObj.material.type,
                    wireframe: parsed.updates.material.wireframe ?? targetObj.material.wireframe,
                  };
                }
                if (parsed.updates.geometry) {
                  updatePayload.geometry = parsed.updates.geometry;
                }
                if (parsed.updates.visible !== undefined) {
                  updatePayload.visible = parsed.updates.visible;
                }
                sceneStore.updateObject(targetObj.id, updatePayload, `Modify ${targetObj.name} via AI`);
                responseMessage = `I've updated ${targetObj.name} as you requested.`;
              } else {
                responseMessage = `I couldn't find an object matching "${parsed.target}". Please check the object name.`;
              }
            }
            break;

          case 'delete':
            if (parsed.target) {
              const targetObj = findObjectByName(parsed.target);
              if (targetObj) {
                sceneStore.removeObject(targetObj.id, `Delete ${targetObj.name} via AI`);
                responseMessage = `I've deleted ${targetObj.name}.`;
              } else {
                responseMessage = `I couldn't find an object matching "${parsed.target}". Please check the object name.`;
              }
            }
            break;

          case 'select':
            if (parsed.target) {
              const targetObj = findObjectByName(parsed.target);
              if (targetObj) {
                sceneStore.setSelectedIds([targetObj.id]);
                responseMessage = `Selected ${targetObj.name}.`;
              } else {
                responseMessage = `I couldn't find an object matching "${parsed.target}". Please check the object name.`;
              }
            }
            break;

          case 'selectMultiple':
            if (parsed.targets && parsed.targets.length > 0) {
              const matchedIds: string[] = [];
              for (const targetName of parsed.targets) {
                const obj = findObjectByName(targetName);
                if (obj) matchedIds.push(obj.id);
              }
              if (parsed.filter?.color) {
                const filteredObjs = findObjectsByFilter(parsed.filter);
                for (const obj of filteredObjs) {
                  if (!matchedIds.includes(obj.id)) {
                    matchedIds.push(obj.id);
                  }
                }
              }
              if (matchedIds.length > 0) {
                sceneStore.setSelectedIds(matchedIds);
                responseMessage = `Selected ${matchedIds.length} object(s).`;
              } else {
                responseMessage = `I couldn't find any objects matching your selection.`;
              }
            }
            break;

          case 'duplicate':
            if (parsed.target) {
              const targetObj = findObjectByName(parsed.target);
              if (targetObj) {
                sceneStore.setSelectedIds([targetObj.id]);
                sceneStore.copySelected();
                sceneStore.startPaste([
                  targetObj.transform.position[0] + 2,
                  targetObj.transform.position[1],
                  targetObj.transform.position[2]
                ]);
                sceneStore.confirmPaste();
                responseMessage = `I've duplicated ${targetObj.name}.`;
              } else {
                responseMessage = `I couldn't find an object matching "${parsed.target}". Please check the object name.`;
              }
            }
            break;

          case 'hide':
            if (parsed.target === 'all') {
              for (const obj of objects) {
                if (!obj.visible) {
                  sceneStore.updateObject(obj.id, { visible: false }, `Hide ${obj.name} via AI`);
                }
              }
              responseMessage = `I've hidden all objects.`;
            } else if (parsed.target) {
              const targetObj = findObjectByName(parsed.target);
              if (targetObj) {
                sceneStore.updateObject(targetObj.id, { visible: false }, `Hide ${targetObj.name} via AI`);
                responseMessage = `I've hidden ${targetObj.name}.`;
              } else {
                responseMessage = `I couldn't find an object matching "${parsed.target}". Please check the object name.`;
              }
            }
            break;

          case 'show':
            if (parsed.target === 'all') {
              for (const obj of objects) {
                if (!obj.visible) {
                  sceneStore.updateObject(obj.id, { visible: true }, `Show ${obj.name} via AI`);
                }
              }
              responseMessage = `I've shown all objects.`;
            } else if (parsed.target) {
              const targetObj = findObjectByName(parsed.target);
              if (targetObj) {
                sceneStore.updateObject(targetObj.id, { visible: true }, `Show ${targetObj.name} via AI`);
                responseMessage = `I've shown ${targetObj.name}.`;
              } else {
                responseMessage = `I couldn't find an object matching "${parsed.target}". Please check the object name.`;
              }
            }
            break;

          case 'group':
            if (parsed.targets && parsed.targets.length >= 2) {
              const matchedIds: string[] = [];
              for (const targetName of parsed.targets) {
                const obj = findObjectByName(targetName);
                if (obj) matchedIds.push(obj.id);
              }
              if (matchedIds.length >= 2) {
                sceneStore.setSelectedIds(matchedIds);
                sceneStore.groupSelected();
                responseMessage = `I've grouped ${matchedIds.length} objects.`;
              } else {
                responseMessage = `I need at least 2 objects to group. Found: ${matchedIds.length}`;
              }
            }
            break;

          case 'ungroup':
            if (parsed.target) {
              const targetObj = findObjectByName(parsed.target);
              if (targetObj && targetObj.type === 'group') {
                sceneStore.ungroupObject(targetObj.id);
                responseMessage = `I've ungrouped ${targetObj.name}.`;
              } else {
                responseMessage = `I couldn't find a group matching "${parsed.target}".`;
              }
            }
            break;

          case 'boolean':
            if (parsed.targets && parsed.targets.length === 2 && parsed.operation) {
              const obj1 = findObjectByName(parsed.targets[0]);
              const obj2 = findObjectByName(parsed.targets[1]);
              if (obj1 && obj2) {
                sceneStore.setSelectedIds([obj1.id, obj2.id]);
                sceneStore.booleanOperation(parsed.operation);
                responseMessage = `I've performed ${parsed.operation} on ${obj1.name} and ${obj2.name}.`;
              } else {
                responseMessage = `I couldn't find the specified objects for the boolean operation.`;
              }
            }
            break;

          case 'undo':
            sceneStore.undo();
            responseMessage = `I've undone the last operation.`;
            break;

          case 'redo':
            sceneStore.redo();
            responseMessage = `I've redone the last operation.`;
            break;

          case 'info':
            responseMessage = parsed.message || `I can help you create and modify 3D objects. Try saying things like "create a red cube" or "move Cube_01 to [1,2,3]".`;
            break;

          case 'complex':
            if (parsed.subAction === 'carve' && parsed.baseObject && parsed.cutObject) {
              // Create base object
              const baseObjData = parsed.baseObject;
              const baseObj: SceneObject = {
                id: crypto.randomUUID(),
                name: baseObjData.name || `Carve_Base_${Date.now()}`,
                type: baseObjData.type,
                geometry: baseObjData.geometry,
                transform: baseObjData.transform,
                material: baseObjData.material,
                visible: true,
              };
              addObject(baseObj);

              // Create cut object (invisible, just for CSG)
              const cutObjData = parsed.cutObject;
              const cutObj: SceneObject = {
                id: crypto.randomUUID(),
                name: cutObjData.name || `Carve_Cut_${Date.now()}`,
                type: cutObjData.type,
                geometry: cutObjData.geometry,
                transform: {
                  position: cutObjData.transform?.position || [0, 0, 0],
                  rotation: cutObjData.transform?.rotation || [0, 0, 0],
                  scale: cutObjData.transform?.scale || [1, 1, 1],
                },
                material: {
                  color: '#000000',
                  opacity: 1,
                  type: 'standard',
                  wireframe: false,
                },
                visible: true,
              };
              addObject(cutObj);

              // Select both and perform subtract
              await new Promise(resolve => setTimeout(resolve, 100));
              sceneStore.setSelectedIds([baseObj.id, cutObj.id]);
              sceneStore.booleanOperation('subtract');
              responseMessage = `I've created a carved shape: ${baseObj.name} with ${cutObj.name} subtracted.`;
            } else {
              responseMessage = `I couldn't understand the complex operation. Try describing it differently.`;
            }
            break;

          default:
            responseMessage = `I'm not sure how to "${parsed.action}". I can help with creating, modifying, deleting, selecting, duplicating, hiding, showing, grouping, ungrouping, boolean operations, undo, redo, and carving complex shapes.`;
        }

        if (responseMessage) {
          addMessage({
            role: 'assistant',
            content: responseMessage,
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      addMessage({
        role: 'assistant',
        content: `Error: ${errorMessage}. Please check your API key and try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const toggleExpand = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    if (isAnimatingOut) {
      closeChat();
      setIsAnimatingOut(false);
    }
  }, [isAnimatingOut, closeChat]);

  const isMessageExpanded = (messageId: string) => expandedMessages[messageId] || false;

  const getDisplayContent = (message: { id: string; content: string }) => {
    return streamingContent[message.id] || message.content;
  };

  const isTruncated = (message: { id: string; content: string }) => {
    const lines = message.content.split('\n').length;
    const approxCharPerLine = 60;
    const totalChars = message.content.length;
    const estimatedLines = Math.ceil(totalChars / approxCharPerLine);
    return estimatedLines > 8 || lines > 8;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleClose}
        onAnimationEnd={handleAnimationEnd}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[400px] max-w-full bg-[#1a1a24] border-l border-white/10 z-50 flex flex-col shadow-2xl ${isAnimatingOut ? 'animate-slideOutRight' : 'animate-slideInRight'}`}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#a855f7] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">AI Modeling Assistant</h3>
              <p className="text-gray-500 text-xs">Create 3D objects with natural language</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            AI Ready
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00d9ff]/20 to-[#a855f7]/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Describe what you want to create, and I&apos;ll generate it in 3D!
              </p>

              {/* Example Prompts */}
              <div className="text-left">
                <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Try saying:</p>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleExampleClick(prompt)}
                      className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 text-xs transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isExpanded = isMessageExpanded(message.id);
            const displayContent = getDisplayContent(message);
            const truncated = isTruncated(message);
            const isStreaming = streamingContent[message.id] !== undefined && streamingContent[message.id] !== message.content;

            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-[#00d9ff] text-[#00363d]'
                      : 'bg-white/10 text-gray-200'
                  }`}
                >
                  <div className={`relative ${!isExpanded && truncated ? 'max-h-48 overflow-hidden' : ''}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {displayContent}
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-[#00d9ff] animate-pulse" />
                      )}
                    </p>
                    {!isExpanded && truncated && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/10 to-transparent" />
                    )}
                  </div>
                  {truncated && (
                    <button
                      onClick={() => toggleExpand(message.id)}
                      className="mt-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {isExpanded ? '↑ Show less' : '↓ Show more'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to create..."
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#00d9ff] resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-[#00d9ff] hover:bg-[#00d9ff]/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[#00363d] font-semibold transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
