"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface VAProfile {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
}

export default function MessagesPage({
  params,
}: {
  params: Promise<{ vaId: string }>;
}) {
  const { vaId } = React.use(params);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [vaProfile, setVAProfile] = useState<VAProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        setCurrentUserId(user.id);

        // Fetch VA profile
        const { data: vaData, error: vaError } = await supabase
          .from("va_profiles")
          .select("id, full_name, profile_picture_url")
          .eq("id", vaId)
          .single();

        if (vaError) throw vaError;
        setVAProfile(vaData);

        // Fetch messages between employer and VA
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${vaId}),and(sender_id.eq.${vaId},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        // Mark messages as read
        const { error: markReadError } = await supabase
          .from("messages")
          .update({ read: true })
          .eq("sender_id", vaId)
          .eq("receiver_id", user.id)
          .eq("read", false);

        if (markReadError) {
          console.error("Error marking messages as read:", markReadError);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vaId, supabase, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            sender_id: currentUserId,
            receiver_id: vaId,
            content: newMessage.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setMessages([...messages, data]);
      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900">Error</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link
                href="/dashboard/employer/hired-vas"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Back to Hired VAs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard/employer/hired-vas"
              className="text-indigo-600 hover:text-indigo-500"
            >
              ← Back to Hired VAs
            </Link>
            <div className="mt-2 flex items-center">
              {vaProfile?.profile_picture_url ? (
                <img
                  className="h-10 w-10 rounded-full mr-3"
                  src={vaProfile.profile_picture_url}
                  alt={vaProfile.full_name}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <span className="text-gray-500 text-sm">
                    {vaProfile?.full_name.charAt(0)}
                  </span>
                </div>
              )}
              <h1 className="text-2xl font-semibold text-gray-900">
                Messages with {vaProfile?.full_name}
              </h1>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            {/* Messages Container */}
            <div className="p-6 h-96 overflow-y-auto border-b">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === currentUserId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === currentUserId
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_id === currentUserId
                              ? "text-indigo-200"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows={3}
                    disabled={sending}
                  />
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
