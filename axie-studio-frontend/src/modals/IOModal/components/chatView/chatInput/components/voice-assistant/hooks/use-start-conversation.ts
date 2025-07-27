import { getLocalStorage } from "@/utils/local-storage-util";

export const useStartConversation = (
  flowId: string,
  wsRef: React.MutableRefObject<WebSocket | null>,
  setStatus: (status: string) => void,
  startRecording: () => void,
  handleWebSocketMessage: (event: MessageEvent) => void,
  stopRecording: () => void,
  currentSessionId: string,
) => {
  const isProduction = window.location.hostname !== 'localhost';
  const backendHost = isProduction ? 'langflow-tv34o.ondigitalocean.app' : window.location.hostname;
  const backendPort = isProduction ? '' : `:${window.location.port}`;
  const protocol = isProduction ? "wss:" : (window.location.protocol === "https:" ? "wss:" : "ws:");
  const url = `${protocol}//${backendHost}${backendPort}/api/v1/voice/ws/flow_tts/${flowId}/${currentSessionId?.toString()}`;

  try {
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const audioSettings = JSON.parse(
      getLocalStorage("lf_audio_settings_playground") || "{}",
    );
    const _audioLanguage =
      getLocalStorage("lf_audio_language_playground") || "en-US";

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      setStatus("Connected to Backend");
      console.log(`WebSocket connected to: ${url}`);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "axiestudio.elevenlabs.config",
            enabled: audioSettings.provider === "elevenlabs",
            voice_id:
              audioSettings.provider === "elevenlabs"
                ? audioSettings.voice
                : "",
          }),
        );

        // For flow_tts endpoint, we need to use the proper session update format
        if (audioSettings.provider !== "elevenlabs") {
          wsRef.current.send(
            JSON.stringify({
              type: "voice.settings",
              voice: audioSettings.voice || "echo",
              provider: audioSettings.provider || "openai",
            }),
          );
        }
        
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('websocketConnected', {
            detail: { url, timestamp: Date.now() }
          }));
        }
        
        setTimeout(() => {
          startRecording();
        }, 300);
      }
    };

    wsRef.current.onmessage = handleWebSocketMessage;

    wsRef.current.onclose = (event) => {
      if (event.code !== 1000) {
        console.warn(`WebSocket closed with code ${event.code} for URL: ${url}`);
      }
      setStatus(`Disconnected (${event.code})`);
      
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('websocketDisconnected', {
          detail: { url, code: event.code, timestamp: Date.now() }
        }));
      }
      
      stopRecording();
    };

    wsRef.current.onerror = (error) => {
      console.error(`WebSocket Error for URL ${url}:`, error);
      setStatus("Backend Connection Error");
      
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('websocketError', {
          detail: { url, error: error.toString(), timestamp: Date.now() }
        }));
      }
      
      stopRecording();
    };
  } catch (error) {
    console.error("Failed to create WebSocket:", error);
    setStatus("Connection failed");
    stopRecording();
  }
};
