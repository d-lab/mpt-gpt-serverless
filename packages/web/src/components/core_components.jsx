import React, { useCallback, useEffect, useRef, useState } from "react";
import ChatBox from "./chatbox.jsx";

function SimpleFrontend() {
  const inIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
    // return true;
  };

  const handleInit = () => {
    console.log("Chatbox initialized.");
  };

  const handleSentMessage = (message) => {
    console.log("Message sent:", message);
  };

  const handleCancelledMessage = () => {
    console.log("Message sending cancelled.");
  };

  const handleErrorMessage = (error) => {
    console.error("Error sending message:", error);
  };

  return (
    <>
      {inIframe() ? (
        <ChatBox
          onInit={handleInit}
          onMessageReceived={handleSentMessage}
          onMessageCancelled={handleCancelledMessage}
          onMessageError={handleErrorMessage}
        />
      ) : (
        <div className="hero min-h-screen bg-base-200 justify-center">
          <div className="hero-content text-center ">
            <div className="max-w-md flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="py-6">Must be on an iframe</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { SimpleFrontend as BaseFrontend };
