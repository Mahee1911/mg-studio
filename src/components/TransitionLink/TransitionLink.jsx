"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageTransition } from "@/providers/TransitionProvider";
const isInternal = (url) => url.origin === window.location.origin;

const isCurrentPage = (url) => url.pathname === window.location.pathname;

export default function TransitionLink({ onClick, children, ...props }) {
  const router = useRouter();
  const { navigate } = usePageTransition();

  const prefetch = (e) => {
    const url = new URL(e.currentTarget.href);
    if (isInternal(url) && !isCurrentPage(url)) router.prefetch(url.pathname);
  };

  const handleClick = (e) => {
    onClick?.(e);

    const link = e.currentTarget;
    const url = new URL(link.href);
    const modified = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

    if (
      e.defaultPrevented ||
      modified ||
      link.target ||
      link.hasAttribute("download") ||
      !isInternal(url)
    ) {
      return;
    }

    if (isCurrentPage(url)) {
      if (!url.hash) e.preventDefault();
      return;
    }

    e.preventDefault();
    navigate(url);
  };

  return (
    <Link
      prefetch={false}
      onPointerEnter={prefetch}
      onPointerDown={prefetch}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
