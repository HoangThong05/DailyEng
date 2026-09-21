import { coverClass, type parseCover } from "@/lib/profile";
import type { Scene } from "@/lib/shop";

type Props = {
  info: ReturnType<typeof parseCover>;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Ảnh bìa hồ sơ: ảnh tải lên, hoặc bìa cửa hàng (ảnh thật nếu có, không thì
 * cảnh vẽ bằng code), hoặc gradient preset.
 */
export function CoverArt({ info, className = "", children }: Props) {
  const shop = info.shop;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${coverClass(info)} ${className}`}>
      {info.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng tải lên, kích thước đã cố định
        <img src={info.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : shop?.art ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh trong public/shop, đã tối ưu sẵn
        <img src={`/shop/${shop.key}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : shop?.scene ? (
        <SceneArt scene={shop.scene} />
      ) : null}
      {children}
    </div>
  );
}

/** Sao rải ngẫu nhiên-nhưng-ổn-định (theo chỉ số) để server và client vẽ giống nhau. */
function starAt(i: number, count: number) {
  const a = (i * 137.508) % 360; // góc vàng → phân bố đều
  const x = ((i * 61.8) % 100) + 0;
  const y = ((a / 360) * 70) % 70;
  const size = 1 + ((i * 7) % 3) * 0.6;
  return { x, y, size, delay: (i % 5) * 0.6, count };
}

/**
 * Cảnh nhiều lớp: trời (gradient), sao lấp lánh, trăng phát sáng, đồi
 * silhouette, tuyết rơi và các emoji đặt cố định (vài cái bồng bềnh).
 */
export function SceneArt({ scene, className = "" }: { scene: Scene; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 select-none overflow-hidden ${className}`} style={{ background: scene.sky }}>
      {scene.stars
        ? Array.from({ length: scene.stars }, (_, i) => {
            const star = starAt(i, scene.stars!);
            return (
              <span
                key={i}
                className="scene-star absolute rounded-full bg-white"
                style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }}
              />
            );
          })
        : null}
      {scene.moon ? (
        <span
          className="absolute rounded-full"
          style={{
            left: `${scene.moon.x}%`,
            top: `${scene.moon.y}%`,
            width: `${scene.moon.size}%`,
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle at 35% 35%, #fff 0%, ${scene.moon.color} 45%, ${scene.moon.color}cc 100%)`,
            boxShadow: `0 0 40px 12px ${scene.moon.color}66, 0 0 90px 30px ${scene.moon.color}33`,
          }}
        />
      ) : null}
      {scene.hills ? (
        <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[42%] w-full">
          <path d="M0 260 C 150 180, 300 300, 450 220 S 750 160, 900 240 S 1100 300, 1200 210 L1200 400 L0 400 Z" fill={scene.hills} opacity="0.75" />
          <path d="M0 320 C 200 250, 400 340, 600 290 S 1000 250, 1200 310 L1200 400 L0 400 Z" fill={scene.hills} />
        </svg>
      ) : null}
      {scene.snow
        ? Array.from({ length: 24 }, (_, i) => (
            <span
              key={`s${i}`}
              className="scene-snow absolute rounded-full bg-white/90"
              style={{ left: `${(i * 4.17) % 100}%`, width: 3 + (i % 3), height: 3 + (i % 3), animationDelay: `${(i % 8) * 0.9}s`, animationDuration: `${6 + (i % 4)}s` }}
            />
          ))
        : null}
      {scene.props?.map((prop, i) => (
        <span
          key={i}
          className={`absolute leading-none drop-shadow-lg ${prop.float ? "scene-float" : ""}`}
          style={{ left: `${prop.x}%`, top: `${prop.y}%`, fontSize: `${prop.size}rem`, transform: "translate(-50%, -50%)", animationDelay: `${i * 0.7}s` }}
        >
          {prop.glyph}
        </span>
      ))}
    </div>
  );
}
