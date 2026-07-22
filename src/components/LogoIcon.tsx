import { useId } from 'react';

interface Props {
  /** Rendered pixel size (width & height). */
  size?: number;
  /** Extra class applied to the svg. */
  className?: string;
}

/**
 * 全站统一的品牌 Logo：正六边形渲染 + 主题渐变（引用 --accent / --accent-2），
 * 内含三节点「团队协作」网络图形。所有出现 Logo 的地方都应引用此组件。
 */
export function LogoIcon({ size = 30, className }: Props) {
  // useId 保证多实例的渐变 id 唯一（去掉冒号以兼容 url(#id) 引用）。
  const gid = `logo-grad-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-2)' }} />
        </linearGradient>
      </defs>
      <path
        d="M16 2L28.12 9L28.12 23L16 30L3.88 23L3.88 9Z"
        fill={`url(#${gid})`}
        strokeLinejoin="round"
      />
      <g stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
        <path d="M16 11L11 20" />
        <path d="M16 11L21 20" />
        <path d="M11 20L21 20" />
      </g>
      <g fill="#fff">
        <circle cx="16" cy="10.5" r="2.8" />
        <circle cx="10.5" cy="20.5" r="2.8" />
        <circle cx="21.5" cy="20.5" r="2.8" />
      </g>
    </svg>
  );
}
