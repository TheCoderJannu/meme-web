import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Phone, Video, ArrowLeft, Search, X } from 'lucide-react';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
};

type Conversation = {
  id: string;
  participant_ids: string[];
  other_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  created_at: string;
};

type ChatProps = {
  onClose: () => void;
};

export const Chat = ({ onClose }: ChatProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  // Load conversations
  useEffect(() => {
    loadConversations();
    
    const subscription = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      const subscription = supabase
        .channel(`messages:${selectedConversation.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` }, () => {
          loadMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for incoming calls
  useEffect(() => {
    const subscription = supabase
      .channel('calls')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: `callee_id=eq.${user.id}` }, (payload) => {
        if (payload.new.status === 'pending') {
          loadCallerInfo(payload.new);
          setIncomingCall(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id]);

      if (error) throw error;

      if (data) {
        // Fetch other user info for each conversation
        const conversationsWithUsers = await Promise.all(
          data.map(async (conv) => {
            const otherUserId = conv.participant_ids.find((id: string) => id !== user.id);
            const { data: userData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', otherUserId)
              .single();

            return {
              ...conv,
              other_user: userData,
            };
          })
        );

        setConversations(conversationsWithUsers);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadCallerInfo = async (call: any) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', call.caller_id)
      .single();

    setIncomingCall({ ...call, caller_info: data });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage,
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startCall = async (callType: 'audio' | 'video') => {
    if (!selectedConversation?.other_user) return;

    try {
      await supabase.from('calls').insert({
        caller_id: user.id,
        callee_id: selectedConversation.other_user.id,
        call_type: callType,
        status: 'pending',
      });

      // In a real app, you'd integrate with WebRTC/Jitsi here
      alert(`${callType.charAt(0).toUpperCase() + callType.slice(1)} call initiated to ${selectedConversation.other_user.display_name}`);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const handleCallResponse = async (accept: boolean) => {
    if (!incomingCall) return;

    try {
      const { error } = await supabase
        .from('calls')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', incomingCall.id);

      if (error) throw error;

      if (accept) {
        alert(`${incomingCall.call_type.charAt(0).toUpperCase() + incomingCall.call_type.slice(1)} call accepted`);
      }
      setIncomingCall(null);
    } catch (error) {
      console.error('Error responding to call:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    searchUsers(query);
  };

  const startConversationWithUser = async (userId: string) => {
    if (!user) return;

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id, userId])
        .single();

      if (existing) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        setSelectedConversation({
          ...existing,
          other_user: userData,
        });
        setShowSearchModal(false);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          participant_ids: [user.id, userId],
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch user info
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const convWithUser = {
        ...newConv,
        other_user: userData,
      };

      setConversations([...conversations, convWithUser]);
      setSelectedConversation(convWithUser);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-40">
          <div className="bg-gray-900 rounded-t-2xl md:rounded-2xl w-full md:w-96 max-h-[90vh] flex flex-col border border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Search & Message</h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                placeholder="Search users by name..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 border border-white/20 focus:border-pink-500 outline-none transition"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p>{searchQuery ? 'No users found' : 'Search to find users to message'}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startConversationWithUser(u.id)}
                      className="w-full p-4 hover:bg-white/5 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                            {u.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{u.display_name || u.username}</p>
                          <p className="text-sm text-gray-400 truncate">@{u.username}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {incomingCall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-2xl p-6 border border-pink-500/30 text-center">
            <h3 className="text-xl font-bold mb-2">Incoming Call</h3>
            <p className="text-gray-300 mb-6">
              {incomingCall.caller_info?.display_name} is calling... ({incomingCall.call_type})
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleCallResponse(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
              >
                Decline
              </button>
              <button
                onClick={() => handleCallResponse(true)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Conversations list */}
        <div className={`w-full md:w-80 bg-gray-900/50 border-r border-white/10 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <button onClick={onClose} className="md:hidden">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold flex-1">Messages</h2>
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Search users"
            >
              <Search className="w-5 h-5 text-pink-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p>No conversations yet</p>
                <p className="text-sm">Start a conversation with someone!</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-3 border-b border-white/5 hover:bg-white/5 transition text-left ${
                    selectedConversation?.id === conv.id ? 'bg-pink-500/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {conv.other_user?.avatar_url ? (
                      <img
                        src={conv.other_user.avatar_url}
                        alt={conv.other_user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                        {conv.other_user?.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{conv.other_user?.display_name || conv.other_user?.username}</p>
                      <p className="text-sm text-gray-400 truncate">Chat with {conv.other_user?.username}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-white/10 bg-gray-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="font-bold">{selectedConversation.other_user?.display_name}</h3>
                  <p className="text-sm text-gray-400">@{selectedConversation.other_user?.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startCall('audio')}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  title="Audio call"
                >
                  <Phone className="w-5 h-5 text-green-500" />
                </button>
                <button
                  onClick={() => startCall('video')}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  title="Video call"
                >
                  <Video className="w-5 h-5 text-blue-500" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_id === user.id
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600'
                        : 'bg-white/10'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-gray-900/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 border border-white/20 focus:border-pink-500 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};
