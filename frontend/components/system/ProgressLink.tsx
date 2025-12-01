"use client";
import Link, { LinkProps } from "next/link";
import NProgress from "nprogress";
import { useCallback } from "react";

export default function ProgressLink({ onClick, className, style, replace, scroll, shallow, prefetch, locale, ...props }: LinkProps & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  prefetch?: boolean;
  locale?: string;
}) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    NProgress.start();
    onClick?.(e);
  }, [onClick]);
  return (
    <Link
      {...props}
      className={className}
      style={style}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      prefetch={prefetch}
      locale={locale}
      onClick={handleClick}
    >
      {props.children}
    </Link>
  );
}
