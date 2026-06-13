import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ai-chat-conversations';
const ANON_ID_KEY = 'ai-chat-anon-id';

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const id = createId();
  return {
    chats: [{ id, title: 'Новый чат', messages: [], createdAt: Date.now() }],
    activeChatId: id,
  };
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getAnonSessionId() {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = createId();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function useChats() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeChat = state.chats.find((c) => c.id === state.activeChatId) || state.chats[0];

  const selectChat = useCallback((id) => {
    setState((prev) => ({ ...prev, activeChatId: id }));
  }, []);

  const newChat = useCallback(() => {
    const id = createId();
    setState((prev) => ({
      chats: [{ id, title: 'Новый чат', messages: [], createdAt: Date.now() }, ...prev.chats],
      activeChatId: id,
    }));
  }, []);

  const deleteChat = useCallback((id) => {
    setState((prev) => {
      const chats = prev.chats.filter((c) => c.id !== id);
      if (chats.length === 0) {
        const newId = createId();
        return {
          chats: [{ id: newId, title: 'Новый чат', messages: [], createdAt: Date.now() }],
          activeChatId: newId,
        };
      }
      return {
        chats,
        activeChatId: prev.activeChatId === id ? chats[0].id : prev.activeChatId,
      };
    });
  }, []);

  const addMessage = useCallback((role, content) => {
    setState((prev) => {
      const chats = prev.chats.map((chat) => {
        if (chat.id !== prev.activeChatId) return chat;
        const messages = [...chat.messages, { role, content }];
        const title = chat.messages.length === 0 && role === 'user'
          ? content.slice(0, 40) + (content.length > 40 ? '…' : '')
          : chat.title;
        return { ...chat, messages, title, updatedAt: Date.now() };
      });
      return { ...prev, chats };
    });
  }, []);

  return {
    chats: state.chats,
    activeChat,
    selectChat,
    newChat,
    deleteChat,
    addMessage,
  };
}
