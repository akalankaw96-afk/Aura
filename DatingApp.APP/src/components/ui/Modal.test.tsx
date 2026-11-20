import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog, Modal } from "./Modal";

/** Esc on a real <dialog> fires a cancelable `cancel` event — jsdom can't, so fire it directly. */
function pressEsc(dialog: HTMLElement) {
  const event = new Event("cancel", { cancelable: true });
  fireEvent(dialog, event);
  return event;
}

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        Body
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Body")).toBeNull();
  });

  it("opens as a dialog named by its title and described by its description", () => {
    render(
      <Modal open onClose={() => {}} title="Block member" description="They won't be able to message you.">
        Body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Block member" });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAccessibleDescription("They won't be able to message you.");
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("uses ariaLabel when there is no visible heading", () => {
    render(
      <Modal open onClose={() => {}} ariaLabel="Filters">
        Body
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("focuses the element marked data-autofocus", () => {
    render(
      <Modal open onClose={() => {}} title="Pick">
        <button type="button">First</button>
        <button type="button" data-autofocus>
          Second
        </button>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
  });

  it("Esc calls onClose and keeps the browser from closing the dialog itself", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Esc">
        Body
      </Modal>,
    );
    const event = pressEsc(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("the close button and a backdrop click call onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal open onClose={onClose} title="Close me">
        Body
      </Modal>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = container.ownerDocument.querySelector("dialog > div > div[aria-hidden='true']") as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closeOnBackdrop={false}: a backdrop click does nothing, Esc still closes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal open onClose={onClose} title="Sticky" closeOnBackdrop={false}>
        Body
      </Modal>,
    );
    await user.click(container.ownerDocument.querySelector("dialog > div > div[aria-hidden='true']") as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
    pressEsc(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismissible={false}: no close button, Esc and backdrop do nothing", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal open onClose={onClose} title="Paying" dismissible={false}>
        Body
      </Modal>,
    );
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    pressEsc(screen.getByRole("dialog"));
    await user.click(container.ownerDocument.querySelector("dialog > div > div[aria-hidden='true']") as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("locks page scroll while open (nested dialogs counted) and restores it", () => {
    const root = document.documentElement;
    root.style.overflow = "auto";
    const { rerender } = render(
      <>
        <Modal open onClose={() => {}} title="Outer" />
        <Modal open onClose={() => {}} title="Inner" />
      </>,
    );
    expect(root.style.overflow).toBe("hidden");

    rerender(
      <>
        <Modal open onClose={() => {}} title="Outer" />
        <Modal open={false} onClose={() => {}} title="Inner" />
      </>,
    );
    expect(root.style.overflow).toBe("hidden"); // the outer one is still open

    rerender(
      <>
        <Modal open={false} onClose={() => {}} title="Outer" />
        <Modal open={false} onClose={() => {}} title="Inner" />
      </>,
    );
    expect(root.style.overflow).toBe("auto");
  });

  it("gives focus back to the button that opened it", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open settings
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Settings">
            Body
          </Modal>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open settings" });
    await user.click(opener);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });
});

describe("ConfirmDialog", () => {
  const base = {
    open: true,
    title: "Remove photo?",
    description: "This can't be undone.",
    confirmLabel: "Remove",
  };

  it("Confirm and Cancel call their handlers", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} onConfirm={onConfirm} onCancel={onCancel} />);

    expect(screen.getByRole("dialog", { name: "Remove photo?" })).toHaveAccessibleDescription("This can't be undone.");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses a custom cancel label and shows extra content", () => {
    render(
      <ConfirmDialog {...base} cancelLabel="Keep it" onConfirm={() => {}} onCancel={() => {}}>
        <label>
          Reason <input />
        </label>
      </ConfirmDialog>,
    );
    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Reason" })).toBeInTheDocument();
  });

  it("confirmDisabled disables only the confirm button", () => {
    render(<ConfirmDialog {...base} confirmDisabled onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });

  it("busy: both buttons disabled, no close button, Esc ignored", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} busy onConfirm={() => {}} onCancel={onCancel} />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    pressEsc(screen.getByRole("dialog"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("Esc cancels when not busy", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} onConfirm={() => {}} onCancel={onCancel} />);
    pressEsc(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
