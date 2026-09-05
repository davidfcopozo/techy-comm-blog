import { BouncingCircles } from "@/components/icons";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] w-full py-12 px-4 animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="scale-75 md:scale-90">
          <BouncingCircles />
        </div>
      </div>
    </div>
  );
}
