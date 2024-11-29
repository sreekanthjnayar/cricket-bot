"use client";

import React, { useState, useEffect, useRef } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
const UserMessage = ({ text }) => {
  return (
    <div className="flex justify-end mb-4">
      <div
        className="rounded-3xl py-3 px-6 max-w-[70%] origin-bottom-right
        bg-gradient-to-r from-[#BBFDAB] to-[#A1E3ED] text-[#011012]
         border-[#BBFDAB]/20 backdrop-blur-sm
        shadow-neon-green"
        style={{
          backfaceVisibility: "hidden",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const AssistantMessage = ({ text }) => {
  return (
    <div className="flex justify-start mb-4">
      <div
        className="animate-message-popup rounded-3xl py-3 px-6 max-w-[70%] origin-bottom-left
        bg-gradient-to-r from-[#0FA8AB] to-[#035F6E] text-white
        border border-[#A1E3ED]/20 backdrop-blur-sm
        shadow-neon-teal"
        style={{
          backfaceVisibility: "hidden",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Message = ({ role, text }) => {
  switch (role) {
    case "user":
      return <UserMessage text={text} />;
    case "assistant":
      return <AssistantMessage text={text} />;
    default:
      return null;
  }
};

async function sendQuery(query) {
  try {
    const response = await fetch("/api/database", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    console.log("Query Results:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
const functionCallHandler = async (toolCall) => {
  if (!toolCall || toolCall.function.name !== "query_database") return;
  const arg = await JSON.parse(toolCall.function.arguments);
  const { query } = arg;
  const result = await sendQuery(query);
  console.log(result);
  return result;
};

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState("");

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`/api/assistant/threads`, {
        method: "POST",
      });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  const sendMessage = async (text) => {
    const response = await fetch(
      `/api/assistant/threads/${threadId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content: text,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  const submitActionResult = async (runId, toolCallOutputs) => {
    const response = await fetch(`/api/assistant/threads/${threadId}/actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runId: runId,
        toolCallOutputs: toolCallOutputs,
      }),
    });
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", text: userInput },
    ]);
    setUserInput("");
    setInputDisabled(true);
    scrollToBottom();
  };

  /* Stream Event Handlers */

  const handleTextCreated = () => {
    appendMessage("assistant", "");
  };

  const handleTextDelta = (delta) => {
    if (delta.value != null) {
      appendToLastMessage(delta.value);
    }
  };

  const toolCallCreated = () => {
    appendMessage("code", "");
  };

  const handleRequiresAction = async (event) => {
    const runId = event.data.id;
    const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const result = await functionCallHandler(toolCall);
        if (!result) {
          return { output: "query failed", tool_call_id: toolCall.id };
        }
        return { output: JSON.stringify(result), tool_call_id: toolCall.id };
      })
    );
    setInputDisabled(true);
    submitActionResult(runId, toolCallOutputs);
  };

  const handleRunCompleted = () => {
    setInputDisabled(false);
  };

  const handleReadableStream = (stream) => {
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);
    stream.on("toolCallCreated", toolCallCreated);
    stream.on("event", (event) => {
      if (event.event === "thread.run.requires_action")
        handleRequiresAction(event);
      if (event.event === "thread.run.completed") handleRunCompleted();
    });
  };

  const appendToLastMessage = (text) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        text: lastMessage.text + text,
      };
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const appendMessage = (role, text) => {
    setMessages((prevMessages) => [...prevMessages, { role, text }]);
  };

  return (
    <div className="flex-1 p:2 sm:p-6 justify-between flex flex-col h-screen bg-[#011012]">
      <div className="flex-1 overflow-y-auto px-4">
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} text={msg.text} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#035F6E]/30 px-4 pt-4 mb-2 sm:mb-0"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            className="text-md w-full focus:outline-none text-[#A1E3ED] placeholder-[#035F6E] 
            pl-6 pr-16 py-4 rounded-full transition-all duration-200
            bg-[#011012]/80 border border-[#035F6E]/50 
            focus:border-[#BBFDAB] focus:ring-2 focus:ring-[#BBFDAB]/20
            focus:shadow-neon-green"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your question"
          />
          <button
            type="submit"
            disabled={inputDisabled}
            className="absolute right-2 inline-flex items-center justify-center rounded-full 
            h-12 w-12 transition-all duration-200 ease-in-out
            bg-gradient-to-r from-[#0FA8AB] to-[#035F6E]
            hover:from-[#BBFDAB] hover:to-[#A1E3ED]
            hover:scale-105 hover:shadow-neon-green
            focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-white group-hover:text-[#011012]"
            >
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
