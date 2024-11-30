"use client";

import React, { useState, useEffect, useRef } from "react";
import { darkTheme } from "../styles/darkTheme";
import { lightTheme } from "../styles/lightTheme";
import { AssistantStream } from "openai/lib/AssistantStream";

const Chat = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Add Theme Toggle Button
  const ThemeToggle = () => {
    return (
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-4 right-4 p-2 rounded-full 
          transition-all duration-200 ease-in-out
          hover:scale-110"
        style={{
          background: `linear-gradient(to right, ${theme.button.from}, ${theme.button.to})`,
        }}
      >
        {isDarkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>
    );
  };

  // Update Message components to use theme
  const UserMessage = ({ text }) => {
    return (
      <div className="flex justify-end mb-4 mt-2">
        <div
          className={`rounded-3xl py-3 px-6 max-w-[70%] origin-bottom-right
            backdrop-blur-sm ${theme.message.user.shadow}`}
          style={{
            background: `linear-gradient(to right, ${theme.message.user.from}, ${theme.message.user.to})`,
            color: theme.message.user.text,
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
          className={`animate-message-popup rounded-3xl py-3 px-6 max-w-[70%] origin-bottom-left
            backdrop-blur-sm ${theme.message.assistant.shadow}`}
          style={{
            background: `linear-gradient(to right, ${theme.message.assistant.from}, ${theme.message.assistant.to})`,
            color: theme.message.assistant.text,
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

  // Update LoadingAnimation to use theme
  const LoadingAnimation = () => {
    return (
      <div className="flex justify-center items-center my-4">
        <img
          src="/ballAnimation.gif"
          alt="Cricket Ball"
          className=""
          style={{
            filter: isDarkMode
              ? `
                  drop-shadow(0 0 4px ${theme.text.primary}) 
                  drop-shadow(0 0 4px ${theme.text.primary}) 
                  brightness(1.3)
                `
              : `
                  drop-shadow(0 0 4px ${theme.message.user.from}) 
                  brightness(1.1)
                `,
          }}
        />
      </div>
    );
  };

  async function sendQuery(query) {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <div
      className="flex-1 flex flex-col h-screen"
      style={{ background: theme.background }}
    >
      <header
        className="border-b px-6 py-4 backdrop-blur-sm"
        style={{
          borderColor: `${theme.border}30`,
          background: theme.headerBg,
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="CricChronicles Logo"
            className="w-10 h-10"
            style={{
              filter: isDarkMode
                ? "drop-shadow(0 0 4px #A1E3ED) brightness(1.3)"
                : "none",
            }}
          />
          <div>
            <h1
              className="text-xl font-bold tracking-wide"
              style={{ color: theme.text.primary }}
            >
              CricChronicles
            </h1>
            <p style={{ color: theme.text.secondary }}>
              Your AI Cricket Expert
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-y-auto px-4">
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} text={msg.text} />
        ))}
        {isLoading && <LoadingAnimation />}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-4 pt-4 mb-2 sm:mb-0"
        style={{
          borderTop: `1px solid ${theme.border}30`,
        }}
      >
        <div className="relative flex items-center mb-3">
          <input
            type="text"
            className="text-md w-full focus:outline-none 
              pl-6 pr-16 py-4 rounded-full transition-all duration-200"
            style={{
              color: theme.text.primary,
              background: `${theme.background}80`,
              border: `1px solid ${theme.input.border}50`,
              boxShadow: `0 0 0 1px ${theme.input.border}20`,
              "::placeholder": { color: theme.input.placeholder },
              ":focus": {
                border: `1px solid ${theme.input.focusBorder}`,
                boxShadow: `0 0 0 2px ${theme.input.focusBorder}20`,
              },
            }}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your question"
          />

          <button
            type="submit"
            disabled={inputDisabled}
            className="absolute right-2 inline-flex items-center justify-center 
              rounded-full h-12 w-12 transition-all duration-200 ease-in-out
              hover:scale-105 focus:outline-none 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: `linear-gradient(to right, ${theme.button.from}, ${theme.button.to})`,
              boxShadow: isDarkMode
                ? `0 0 10px ${theme.button.from}40`
                : `0 2px 4px ${theme.button.from}20`,
              ":hover": {
                background: `linear-gradient(to right, ${theme.button.hover.from}, ${theme.button.hover.to})`,
              },
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-white"
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
