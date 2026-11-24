import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { SydiaPromo } from "./promo/SydiaPromo";
import { SydiaShowcase, SydiaShowcaseSquare } from "./showcase/SydiaShowcase";
import { FPS, TOTAL_FRAMES } from "./showcase/timeline";
import { SydiaSeller } from "./seller/SydiaSeller";
import { TOTAL_FRAMES as SELLER_FRAMES } from "./seller/timeline";
import { TitipanTelur } from "./titipan/TitipanTelur";
import { TOTAL_FRAMES as TITIPAN_FRAMES } from "./titipan/timeline";
import { SibukSeharian } from "./sibuk/SibukSeharian";
import { TOTAL_FRAMES as SIBUK_FRAMES } from "./sibuk/timeline";
import { CumaSepuluhMenit } from "./fallacy/CumaSepuluhMenit";
import { TOTAL_FRAMES as FALLACY_FRAMES } from "./fallacy/timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SydiaPromo"
        component={SydiaPromo}
        durationInFrames={960}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SydiaShowcase"
        component={SydiaShowcase}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="SydiaShowcaseSquare"
        component={SydiaShowcaseSquare}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1080}
      />
      <Composition
        id="SydiaSeller"
        component={SydiaSeller}
        durationInFrames={SELLER_FRAMES}
        fps={FPS}
        width={1080}
        height={1080}
      />
      <Composition
        id="TitipanTelur"
        component={TitipanTelur}
        durationInFrames={TITIPAN_FRAMES}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SibukSeharian"
        component={SibukSeharian}
        durationInFrames={SIBUK_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CumaSepuluhMenit"
        component={CumaSepuluhMenit}
        durationInFrames={FALLACY_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <MyComposition />
    </>
  );
};
