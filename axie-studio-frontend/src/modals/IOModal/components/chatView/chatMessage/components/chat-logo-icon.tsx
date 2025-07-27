import AxieStudioLogo from "@/assets/AxieStudioLogo.svg?react";

export default function LogoIcon() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-muted">
      <div className="flex h-8 w-8 items-center justify-center">
        <AxieStudioLogo
          title="Axie Studio Logo"
          className="absolute h-[18px] w-[18px]"
        />
      </div>
    </div>
  );
}
