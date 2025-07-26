import LoadingComponent from "@/components/common/loadingComponent";
import { ENABLE_DATASTAX_AXIE_STUDIO } from "../feature-flags";

type CustomLoaderProps = {
  remSize?: number;
};

const CustomLoader = ({ remSize = 30 }: CustomLoaderProps) => {
  return ENABLE_DATASTAX_AXIE_STUDIO ? (
    <></>
  ) : (
    <LoadingComponent remSize={remSize} />
  );
};

export default CustomLoader;
