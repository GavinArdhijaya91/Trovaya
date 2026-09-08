"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";

// Replika EmojiAvatar bawaan RainbowKit (src/components/Avatar/emojiAvatarForAddress.ts)
// supaya logo avatar tidak hilang setelah migrasi dari <ConnectButton> ke Custom
const RK_COLORS = [
  "#FC5C54","#FFD95A","#E95D72","#6A87C8","#5FD0F3","#75C06B","#FFDD86","#5FC6D4","#FF949A","#FF8024",
  "#9BA1A4","#EC66FF","#FF8CBC","#FF9A23","#C5DADB","#A8CE63","#71ABFF","#FFE279","#B6B1B6","#FF6780",
  "#A575FF","#4D82FF","#FFB35A",
];
const RK_AVATARS: { color: string; emoji: string }[] = [
  { color: RK_COLORS[0], emoji: "🌸" }, { color: RK_COLORS[1], emoji: "🤠" }, { color: RK_COLORS[2], emoji: "🐙" },
  { color: RK_COLORS[3], emoji: "🫐" }, { color: RK_COLORS[4], emoji: "🐳" }, { color: RK_COLORS[0], emoji: "🥶" },
  { color: RK_COLORS[5], emoji: "🌲" }, { color: RK_COLORS[6], emoji: "🌞" }, { color: RK_COLORS[7], emoji: "🐢" },
  { color: RK_COLORS[8], emoji: "🐶" }, { color: RK_COLORS[9], emoji: "🦊" }, { color: RK_COLORS[10], emoji: "🐼" },
  { color: RK_COLORS[11], emoji: "🦄" }, { color: RK_COLORS[12], emoji: "🐷" }, { color: RK_COLORS[13], emoji: "🐧" },
  { color: RK_COLORS[8], emoji: "🦩" }, { color: RK_COLORS[14], emoji: "👽" }, { color: RK_COLORS[0], emoji: "🎈" },
  { color: RK_COLORS[8], emoji: "🍉" }, { color: RK_COLORS[1], emoji: "🎉" }, { color: RK_COLORS[15], emoji: "🐨" },
  { color: RK_COLORS[16], emoji: "🌎" }, { color: RK_COLORS[17], emoji: "🍊" }, { color: RK_COLORS[18], emoji: "🦝" },
  { color: RK_COLORS[19], emoji: "🍣" }, { color: RK_COLORS[1], emoji: "🐥" }, { color: RK_COLORS[20], emoji: "👾" },
  { color: RK_COLORS[15], emoji: "🥦" }, { color: RK_COLORS[0], emoji: "👹" }, { color: RK_COLORS[17], emoji: "😰" },
  { color: RK_COLORS[4], emoji: "⛳" }, { color: RK_COLORS[21], emoji: "⛵️" }, { color: RK_COLORS[17], emoji: "🥳" },
  { color: RK_COLORS[8], emoji: "🤯" }, { color: RK_COLORS[22], emoji: "🤠" },
];
function hashCode(text: string): number {
  let hash = 0;
  if (text.length === 0) return hash;
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}
function emojiAvatarForAddress(address: string) {
  const idx = Math.abs(hashCode(address.toLowerCase()) % RK_AVATARS.length);
  return RK_AVATARS[idx ?? 0];
}
function FallbackAvatar({ address }: { address?: string }) {
  const { color, emoji } = emojiAvatarForAddress(address ?? "");
  return (
    <span
      aria-hidden
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: color,
        display: "inline-grid",
        placeItems: "center",
        fontSize: 11,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {emoji}
    </span>
  );
}

/**
 * Wrapper ConnectButton dengan animasi chevron rotate ketika
 * modal account / chain dibuka & ditutup.
 *
 * Menggunakan ConnectButton.Custom (render-prop API) agar kita bisa
 * mengelola state open sendiri dan menerapkan `transform: rotate`
 * pada DropdownIcon SVG sesuai state tersebut.
 */
export function CustomConnectButton({
  label = "Connect account",
  accountStatus = "avatar" as "avatar" | "address" | "full",
  chainStatus = "icon" as "icon" | "name" | "full" | "none",
  showBalance = false,
}: {
  label?: string;
  accountStatus?: "avatar" | "address" | "full";
  chainStatus?: "icon" | "name" | "full" | "none";
  showBalance?: boolean;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);

  // Deteksi penutupan modal RainbowKit.
  // Dialog di-render via createPortal dengan role="dialog" + aria-modal="true"
  // di dalam subtree [data-rk]. Observe document.body agar tetap jalan
  // meskipun [data-rk] belum ada saat mount.
  useEffect(() => {
    const hasOpenDialog = () =>
      document.querySelectorAll('[data-rk] [role="dialog"][aria-modal="true"], [data-rk] [role="dialog"]').length > 0;

    const checkClosed = () => {
      if (!hasOpenDialog()) {
        setAccountOpen(false);
        setChainOpen(false);
      }
    };

    const observer = new MutationObserver(checkClosed);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-modal", "role"] });

    // Fallback: RainbowKit juga menutup via ESC / backdrop — MutationObserver sudah cover,
    // tapi tambahkan listener untuk memastikan reset saat navigasi / unmount dialog animasi
    const onTransitionEnd = () => checkClosed();
    document.addEventListener("transitionend", onTransitionEnd);

    return () => {
      observer.disconnect();
      document.removeEventListener("transitionend", onTransitionEnd);
    };
  }, []);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
        authenticationStatus,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        if (!ready) {
          return (
            <div aria-hidden="true" style={{ opacity: 0, pointerEvents: "none", userSelect: "none" }} />
          );
        }

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              type="button"
              className="rk-connect-btn"
            >
              {label}
            </button>
          );
        }

        const handleChainClick = () => {
          setChainOpen(true);
          setAccountOpen(false);
          openChainModal();
        };

        const handleAccountClick = () => {
          setAccountOpen(true);
          setChainOpen(false);
          openAccountModal();
        };

        return (
          <div style={{ display: "flex", gap: "8px" }}>
            {/* Chain / Network button */}
            {chain && (
              <button
                onClick={handleChainClick}
                type="button"
                aria-expanded={chainOpen}
                className="rk-connect-btn rk-chain-btn"
                style={{
                  background: chain.unsupported
                    ? "var(--rk-colors-connectButtonBackgroundError, #ff494a)"
                    : "var(--rk-colors-connectButtonBackground, #fff)",
                }}
              >
                {chain.unsupported ? (
                  <span>Wrong network</span>
                ) : (
                  <>
                    {chain.hasIcon && chainStatus !== "none" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={chain.iconUrl}
                        alt={chain.name ?? "Chain icon"}
                        width={18}
                        height={18}
                        style={{ borderRadius: "50%", display: "block" }}
                      />
                    )}
                    {(chainStatus === "full" || chainStatus === "name") && (
                      <span>{chain.name}</span>
                    )}
                  </>
                )}
                <svg
                  fill="none"
                  height="7"
                  width="14"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rk-chevron"
                  data-open={String(chainOpen)}
                >
                  <title>Dropdown</title>
                  <path
                    d="M12.75 1.54001L8.51647 5.0038C7.77974 5.60658 6.72026 5.60658 5.98352 5.0038L1.75 1.54001"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                </svg>
              </button>
            )}

            {/* Account / Wallet info button */}
            {!chain?.unsupported && (
              <button
                onClick={handleAccountClick}
                type="button"
                aria-expanded={accountOpen}
                className="rk-connect-btn rk-account-btn"
              >
                {accountStatus !== "address" &&
                  (account.ensAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={account.ensAvatar}
                      alt={account.displayName}
                      width={20}
                      height={20}
                      style={{ borderRadius: "50%", display: "block", flexShrink: 0 }}
                    />
                  ) : (
                    <FallbackAvatar address={account.address} />
                  ))}
                {(accountStatus === "full" || accountStatus === "address") && (
                  <span>{account.displayName}</span>
                )}
                {showBalance && account.displayBalance && (
                  <span style={{ opacity: 0.7 }}>{account.displayBalance}</span>
                )}
                <svg
                  fill="none"
                  height="7"
                  width="14"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rk-chevron"
                  data-open={String(accountOpen)}
                >
                  <title>Dropdown</title>
                  <path
                    d="M12.75 1.54001L8.51647 5.0038C7.77974 5.60658 6.72026 5.60658 5.98352 5.0038L1.75 1.54001"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
