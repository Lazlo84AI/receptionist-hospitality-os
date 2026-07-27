import { useState, useRef, useEffect } from 'react';
import { Send, FileText, Loader2, Star, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AssistantFloatingRAGUpload } from '@/components/AssistantFloatingRAGUpload';
import { useAssistantChat, FEEDBACK_REASONS, ChatMessage, Source } from '@/hooks/useAssistantChat';

const cleanText = (t: string) =>
  t.replace(/^[=\-\s]+/, '')
   .replace(/\*\*(.+?)\*\*/g, '$1')
   .replace(/__(.+?)__/g, '$1')
   .trim();

const AssistantBody = ({ summary, detail, assumptions }: {
  summary?: string; detail?: string; assumptions?: string[];
}) => {
  const s = summary ? cleanText(summary) : '';
  const d = detail ? cleanText(detail) : '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {s && (
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1E1A37', lineHeight: 1.5 }}>
          {s}
        </p>
      )}
      {d && (
        <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {d}
        </p>
      )}
      {assumptions && assumptions.length > 0 && (
        <div style={{
          fontSize: '12px', color: '#92400e',
          background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)',
          borderRadius: '8px', padding: '6px 10px',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {assumptions.map((a, i) => <span key={i}>⚠️ Hypothèse : {a}</span>)}
        </div>
      )}
    </div>
  );
};

const ConfidenceBadge = ({ confidence }: { confidence?: string }) => {
  if (!confidence) return null;
  const map: Record<string, { label: string; dotColor: string }> = {
    high:   { label: 'High confidence',   dotColor: '#4ade80' },
    medium: { label: 'Medium confidence', dotColor: '#fb923c' },
    bad:    { label: 'Low confidence',    dotColor: '#f87171' },
  };
  const cfg = map[confidence];
  if (!cfg) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9ca3af' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cfg.dotColor, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const SourcesChips = ({ sources }: { sources: Source[] }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, marginBottom: '6px' }}>Sources</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {sources.map((src, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', gap: '2px',
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: '8px', padding: '6px 10px', maxWidth: '220px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText style={{ width: '12px', height: '12px', color: '#BBA57A', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E1A37', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {src.name}
              </span>
              {src.storage_url && (
                <a href={src.storage_url} target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: 'auto', flexShrink: 0, color: '#BBA57A' }}>
                  <ExternalLink style={{ width: '11px', height: '11px' }} />
                </a>
              )}
            </div>
            {src.excerpt && (
              <p style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic', margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                "{src.excerpt}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} onClick={() => onChange(n)}
        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer' }}>
        <Star style={{
          width: '20px', height: '20px',
          color: n <= value ? '#BBA57A' : '#d1d5db',
          fill: n <= value ? '#BBA57A' : 'none',
        }} />
      </button>
    ))}
  </div>
);

const FeedbackPanel = ({ message, onSubmit }: {
  message: ChatMessage;
  onSubmit: (rating: number, reasons: string[], comment: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  if (done || message.feedbackDone) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
        <Star style={{ width: '12px', height: '12px', fill: '#BBA57A', color: '#BBA57A' }} />
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Merci pour votre retour</span>
      </div>
    );
  }

  const toggleReason = (r: string) =>
    setReasons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handleSend = () => {
    if (!rating) return;
    onSubmit(rating, reasons, comment);
    setDone(true);
  };

  return (
    <div style={{ marginTop: '6px' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px',
          color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {open
          ? <ChevronUp style={{ width: '12px', height: '12px' }} />
          : <ChevronDown style={{ width: '12px', height: '12px' }} />}
        Évaluer cette réponse
      </button>

      {open && (
        <div style={{ marginTop: '8px', padding: '12px', background: '#f9fafb',
          borderRadius: '12px', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <StarRating value={rating} onChange={setRating} />

          {rating > 0 && rating <= 3 && (
            <>
              <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, margin: 0 }}>
                Qu'est-ce qui n'allait pas ?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {FEEDBACK_REASONS.map(r => (
                  <button key={r} onClick={() => toggleReason(r)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: `1px solid ${reasons.includes(r) ? '#1E1A37' : '#e5e7eb'}`,
                      backgroundColor: reasons.includes(r) ? '#1E1A37' : '#ffffff',
                      color: reasons.includes(r) ? '#ffffff' : '#6b7280',
                      cursor: 'pointer',
                    }}>
                    {r}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Précisez si besoin (optionnel)..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="text-xs min-h-14 resize-none border-gray-200"
              />
            </>
          )}

          {rating > 0 && (
            <button onClick={handleSend}
              style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '5px 14px',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                backgroundColor: '#BBA57A', color: '#1E1A37', fontWeight: 600 }}>
              Envoyer
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────
const Assistant = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, submitFeedback } = useAssistantChat(user?.id);
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;
    const q = question.trim();
    setQuestion('');
    await sendMessage(q);
    toast({ title: 'Réponse reçue', description: "L'assistant a traité votre question." });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-champagne-gold/20">
          <h1 className="text-3xl font-playfair font-semibold text-palace-navy mb-1">Intelligent Assistant</h1>
          <p className="text-gray-500">Ask your questions and get instant answers</p>
        </div>

        {/* 2 cartes du haut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-warm-cream">Question Input</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Type your question here… (Enter to send, Shift+Enter for new line)"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-32 resize-none border-champagne-gold/20 focus:border-champagne-gold"
              />
              <Button
                onClick={handleSubmit}
                disabled={!question.trim() || isLoading}
                className="w-full bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90"
              >
                {isLoading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                  : <><Send className="h-4 w-4 mr-2" />Send your question</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-warm-cream">Assistant Response</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 bg-champagne-gold/10 rounded-xl border-2 border-champagne-gold/20">
                  <Loader2 className="h-8 w-8 text-champagne-gold animate-spin" />
                  <p className="text-sm font-medium text-palace-navy">Processing your question...</p>
                  <p className="text-xs text-gray-400">The AI assistant is analyzing your request</p>
                </div>
              ) : lastAssistantMsg ? (
                <div style={{ background: 'rgba(187,165,122,0.12)', border: '1px solid rgba(187,165,122,0.3)',
                  borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E1A37' }}>Latest Response</span>
                    <ConfidenceBadge confidence={lastAssistantMsg.confidence} />
                  </div>
                  <AssistantBody
                    summary={lastAssistantMsg.summary}
                    detail={lastAssistantMsg.content}
                    assumptions={lastAssistantMsg.assumptions}
                  />
                  <SourcesChips sources={lastAssistantMsg.sources || []} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">Waiting for your question</p>
                  <p className="text-xs text-gray-400">Ask a question to receive a personalized response</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Conversation History ── */}
        {messages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-warm-cream text-sm flex items-center gap-2">
                💬 Conversation History
                <span className="ml-auto text-xs font-normal text-gray-400">
                  {messages.filter(m => m.role === 'user').length} question{messages.filter(m => m.role === 'user').length > 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">

                {messages.map(msg => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id} style={{
                      display: 'flex', width: '100%', gap: '8px', alignItems: 'flex-end',
                      flexDirection: isUser ? 'row-reverse' : 'row',
                    }}>
                      {/* Avatar */}
                      <div style={{
                        flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 700,
                        backgroundColor: isUser ? '#1E1A37' : '#BBA57A', color: '#fff',
                      }}>
                        {isUser ? 'You' : 'AI'}
                      </div>

                      {/* Bulle + métadonnées */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '4px',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                      }}>
                        <div style={{
                          padding: '10px 16px', fontSize: '14px', lineHeight: 1.55,
                          borderRadius: '18px',
                          borderBottomRightRadius: isUser ? '4px' : '18px',
                          borderBottomLeftRadius: isUser ? '18px' : '4px',
                          backgroundColor: isUser ? '#1E1A37' : '#ffffff',
                          color: isUser ? '#ffffff' : '#1f2937',
                          border: isUser ? 'none' : '1px solid #f0f0f0',
                          boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                          {isUser
                            ? cleanText(msg.content)
                            : <AssistantBody summary={msg.summary} detail={msg.content} assumptions={msg.assumptions} />}
                        </div>

                        {!isUser && (
                          <div style={{ paddingLeft: '4px', width: '100%' }}>
                            <ConfidenceBadge confidence={msg.confidence} />
                            {msg.actionSteps && msg.actionSteps.length > 0 && (
                              <ol style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '16px', margin: '4px 0' }}>
                                {msg.actionSteps.map((s, i) => <li key={i}>{cleanText(s)}</li>)}
                              </ol>
                            )}
                            <SourcesChips sources={msg.sources || []} />
                            {msg.conversationId && (
                              <FeedbackPanel
                                message={msg}
                                onSubmit={(r, rs, c) =>
                                  submitFeedback(msg.conversationId!, msg.id, r, rs, c)
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isLoading && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{
                      flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700, backgroundColor: '#BBA57A', color: '#fff',
                    }}>AI</div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center">
                        {[0, 150, 300].map(delay => (
                          <span key={delay}
                            className="w-2 h-2 bg-champagne-gold rounded-full animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AssistantFloatingRAGUpload />
    </div>
  );
};

export default Assistant;
