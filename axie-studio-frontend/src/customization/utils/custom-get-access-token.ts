import { Cookies } from "react-cookie";
import { AXIE_STUDIO_ACCESS_TOKEN } from "@/constants/constants";

export const customGetAccessToken = () => {
  const cookies = new Cookies();
  return cookies.get(AXIE_STUDIO_ACCESS_TOKEN);
};
