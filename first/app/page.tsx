'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Header } from '@/components/ui/header';
import { type PromptInputMessage, PromptInput, PromptInputActionAddAttachments, PromptInputActionMenu, PromptInputActionMenuContent, PromptInputActionMenuTrigger, PromptInputAttachment, PromptInputAttachments, PromptInputBody, PromptInputFooter, PromptInputHeader, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from '@/components/ai-elements/prompt-input';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';

export default function Chat() {
  const { messages, status, sendMessage } = useChat();
  const [text, setText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }

    // Convert files to base64 if present
    let imageData: string | undefined;
    if (message.files && message.files.length > 0) {
      const file = message.files[0];
      if (file.url) {
        // If it's already a data URL, use it directly
        imageData = file.url;
      }
    }

    sendMessage({
      text: message.text || '',
      experimental_attachments: message.files,
      data: imageData ? { image: imageData } : undefined
    });

    setText('');
  };

  useEffect(() => {
    console.log("messages", messages);
  }, [messages]);

  return (
    <div className="flex min-h-screen flex-col w-3xl mx-auto justify-between items-center gap-20 border border-slate-800 rounded-xl" >

      <Header />

      <div className='max-w-[90%] text-center'>

        <div className="mt-4">
          {!messages.length && <p className="text-slate-400">Type a prompt to query stored cards.</p>}
        </div>
      </div>

      <div className='bottom-0 w-full min-h-10'>
        <div className="flex flex-col h-full">
          <Conversation>
            <ConversationContent>
              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts && message.parts.length > 0 ? (
                      message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return (
                              <MessageResponse key={`${message.id}-${i}`}>
                                {part.text}
                              </MessageResponse>
                            );
                          default:
                            return null;
                        }
                      })
                    ) : (
                      <MessageResponse>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(message as any).content}
                      </MessageResponse>
                    )}
                  </MessageContent>
                </Message>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>

              <PromptInputTextarea
                onChange={(e) => setText(e.target.value)}
                ref={textareaRef}
                value={text}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit disabled={!text && !status} status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}