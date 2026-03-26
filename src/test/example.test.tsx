import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Header from "@/components/Header";
import VoiceEngine from "@/components/VoiceEngine";

describe("Header", () => {
  it("shows online status when connected", () => {
    render(<Header isConnected />);
    expect(screen.getByText(/Local Core: Online/i)).toBeInTheDocument();
  });

  it("shows offline status when disconnected", () => {
    render(<Header isConnected={false} />);
    expect(screen.getByText(/Local Core: Offline/i)).toBeInTheDocument();
  });
});

describe("VoiceEngine", () => {
  it("supports keyboard hold-to-speak interactions", () => {
    const onDown = vi.fn();
    const onUp = vi.fn();

    render(
      <VoiceEngine
        isRecording={false}
        isProcessing={false}
        lastCommand=""
        onPointerDown={onDown}
        onPointerUp={onUp}
      />
    );

    const button = screen.getByRole("button", { name: /hold to speak/i });
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyUp(button, { key: "Enter" });

    expect(onDown).toHaveBeenCalledTimes(1);
    expect(onUp).toHaveBeenCalledTimes(1);
  });
});
