import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Source {
  name: string;
  excerpt: string;
  storage_url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  summary?: string;
  assumptions?: string[];
  confidence?: 'high' | 'medium' | 'bad';
  sources?: Source[];
  actionSteps?: string[];
  conversationId?: string;
  feedbackRating?: number;
  feedbackDone?: boolean;
}

export const FEEDBACK_REASONS = [
  'Réponse incorrecte',
  'Pas assez détaillée',
  'Hors sujet',
  'Source manquante',
  'Autre',
];

const WEBHOOK_URL = 'https://sokle.app.n8n.cloud/webhook/intelligent_assistant';

export function useAssistantChat(userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = useRef<string>(crypto.randomUUID());

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    // Historique existant à envoyer à N8N pour mémoire contextuelle
    const historyForN8N = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          session_id: sessionId.current,
          history: historyForN8N,
          user_id: userId || 'anonymous',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const d = Array.isArray(data) ? data[0] : data;

      let summary: string = d.summary || '';
      const detail: string = d.answer || d.response || '';
      if (!summary && !detail) summary = 'Réponse reçue mais format inattendu';
      const assumptions: string[] = Array.isArray(d.assumptions) ? d.assumptions : [];
      const confidence = d.confidence || null;
      const sources: Source[] = Array.isArray(d.sources) ? d.sources : [];
      const actionSteps: string[] = Array.isArray(d.action_steps) ? d.action_steps : [];
      const needsReview = !confidence || confidence !== 'high';

      // Persistance Supabase
      let conversationId: string | undefined;
      if (userId) {
        const { data: row, error } = await supabase
          .from('assistant_conversations')
          .insert({
            session_id: sessionId.current,
            user_id: userId,
            question: question.trim(),
            answer: detail || summary,
            confidence: confidence || 'medium',
            sources: sources as any,
            history_snapshot: historyForN8N as any,
            needs_review: needsReview,
          })
          .select('id')
          .single();

        if (!error) conversationId = row?.id;
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: detail,
        summary,
        confidence,
        sources,
        actionSteps,
        assumptions,
        conversationId,
        feedbackDone: false,
      }]);

    } catch (err) {
      console.error('Assistant error:', err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, userId]);

  const submitFeedback = useCallback(async (
    conversationId: string,
    messageId: string,
    rating: number,
    reasons: string[],
    comment: string,
  ) => {
    await supabase
      .from('assistant_conversations')
      .update({
        feedback_rating: rating,
        feedback_reasons: reasons,
        feedback_comment: comment || null,
        feedback_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, feedbackRating: rating, feedbackDone: true }
        : m
    ));
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    submitFeedback,
    sessionId: sessionId.current,
  };
}
