import React, { useCallback, useEffect, useRef, useState } from "react";
import useBulkTrackEvents from "./useBulkTrackEvents";

const BotMessageBox = ({ message, onCopy }) => {
  return (
    <div className="chat chat-start">
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img src="https://codebaby.com/wp-content/uploads/2023/01/chatgpt-logo.png" />
        </div>
      </div>
      <div className="chat-header">
        Bot
        {/* <time className="text-xs opacity-50">12:46</time> */}
      </div>
      <div className="chat-bubble bg-primary" onCopy={onCopy}>
        {message}
      </div>
    </div>
  );
};

const UserMessageBox = ({ message, onCopy }) => {
  return (
    <div className="chat chat-end">
      {/* <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img src="/images/stock/photo-1534528741775-53994a69daeb.jpg" />
        </div>
      </div> */}
      <div className="chat-header">
        You
        {/* <time className="text-xs opacity-50">12:46</time> */}
      </div>
      <div className="chat-bubble " onCopy={onCopy}>
        {message}
      </div>
      {/* <div className="chat-footer opacity-50">Seen at 12:46</div> */}
    </div>
  );
};
const host = process.env.REACT_APP_API_URL;
const ChatBox = ({
  onMessageReceived,
  onInit,
  onMessageSubmitted,
  onMessageCancelled,
  onMessageError,
}) => {
  const inputRef = useRef(null);
  const messageBoxRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      content: "Hello, I am a chatbot. How can I help you?",
      role: "assistant",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const { cacheEvent } = useBulkTrackEvents(
    (events) => {
      const parsedEvents = events.map((event) => ({
        provider: event.provider,
        metadata: event.metadata,
        event: event.event,
      }));

      const body = {
        data: parsedEvents,
      };

      fetch(`${host}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }).catch(Boolean);
    },
    false,
    5000
  );

  const trackEvent = useCallback((event) => {
    // "url?provider=mturk&agentId=123123"
    const { provider, metadata } = getMetadata();

    event.timestamp = new Date().toISOString();

    cacheEvent({
      provider,
      event,
      metadata,
    });
  }, []);

  const chatGPT = async (newMessages, metadata, provider) => {
    const fetchResponse = await fetch(`${host}/gpt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        metadata,
        messages: newMessages,
      }),
    });

    const responseJson = await fetchResponse.json();
    return responseJson.choices[0].message;
  };

  const sendMessage = useCallback(async () => {
    const input = inputRef.current?.value.trim();
    if (input === "") {
      return;
    }

    setLoading(true);

    try {
      const newMessages = [...messages, { role: "user", content: input }];
      setMessages((prev) => [...prev, { role: "user", content: input }]);
      // Simulate API response (replace with your API call)

      const { provider, metadata } = getMetadata();
      const botReply = await chatGPT(newMessages, metadata, provider);
      setLoading(false);

      inputRef.current.value = "";
      setMessages((prev) => [...prev, botReply]);

      onMessageReceived && onMessageReceived(botReply);

    } catch (error) {
      setLoading(false);
      console.error("Error sending message:", error);
      onMessageError && onMessageError(error);
    }
  }, [inputRef.current, messages]);

  const scrollToBottom = () => {
    messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
  };

  const handleCancel = () => {
    setLoading(false);
    onMessageCancelled && onMessageCancelled();
  };

  useEffect(() => {
    onInit && onInit();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function paramsToObject(entries) {
    const result = {};
    for (const [key, value] of entries) {
      result[key] = value;
    }
    return result;
  }

  const getMetadata = () => {
    const params = new URLSearchParams(window.location.search);
    const paramsObj = paramsToObject(params);

    const provider = paramsObj.provider || "unknown";
    const metadata = { ...paramsObj };
    delete metadata.provider;

    return {
      provider,
      metadata,
    };
  };

  const onKeydown = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (!e.repeat) {
        await sendMessage();
      }

      e.preventDefault(); // Prevents the addition of a new line in the text field
    }
  };

  const onInput = (e) => {
    trackEvent({
      event: "input",
      value: e.target.value,
    });
  };

  const debounce = (func, wait) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const onPaste = (e) => {
    trackEvent({
      event: "paste",
      value: (e.clipboardData || window.clipboardData).getData("text"),
    });
  };

  const onCopy = (e) => {
    trackEvent({
      event: "copy",
      value: window.getSelection().toString(),
    });
  };

  return (
    <div className="w-full h-full flex flex-col p-1">
      <header className="rounded-t-lg flex items-center justify-between py-2 px-4 bg-primary h-12 text-white">
        Chat GPT
      </header>
      <div
        ref={messageBoxRef}
        className="grow w-100 overflow-y-scroll py-2 my-2"
      >
        {messages.map(({ role, content }, index) => (
          <>
            {role === "assistant" && (
              <BotMessageBox
                onCopy={onCopy}
                key={"assistant-" + index}
                message={content}
              />
            )}
            {role === "user" && (
              <UserMessageBox
                onCopy={onCopy}
                key={"user-" + index}
                message={content}
              />
            )}
          </>
        ))}
      </div>

      <div className="input-box flex gap-2 ">
        <textarea
          id="chat-input-box"
          autoFocus
          ref={inputRef}
          onPaste={onPaste}
          onInput={debounce(onInput, 5000)}
          onKeyDown={onKeydown}
          minLength={1}
          disabled={loading}
          placeholder="Type your message..."
          style={{
            resize: "none",
          }}
          className="flex-1 rounded-lg px-2 py-1 border textarea-primary"
        />
        <div className="w-16 flex items-center">
          <button
            disabled={loading}
            onClick={loading ? null : sendMessage}
            className="btn btn-primary btn-sm h-full w-16"
          >
            {loading ? (
              <span className="loading text-sm loading-spinner loading-sm">
                Loading
              </span>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
