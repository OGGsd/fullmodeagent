import * as Form from "@radix-ui/react-form";
import { useContext, useState } from "react";
import AxieStudioLogo from "@/assets/AxieStudioLogo.jpg";
import { useLoginUser } from "@/controllers/API/queries/auth";
import { CustomLink } from "@/customization/components/custom-link";
import InputComponent from "../../../components/core/parameterRenderComponent/components/inputComponent";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { SIGNIN_ERROR_ALERT } from "../../../constants/alerts_constants";
import { CONTROL_LOGIN_STATE } from "../../../constants/constants";
import { AuthContext } from "../../../contexts/authContext";
import useAlertStore from "../../../stores/alertStore";
import type { LoginType } from "../../../types/api";
import type {
  inputHandlerEventType,
  loginInputStateType,
} from "../../../types/components";
import { Shield, ArrowLeft, Lock } from "lucide-react";

export default function LoginAdminPage() {
  const [inputState, setInputState] =
    useState<loginInputStateType>(CONTROL_LOGIN_STATE);
  const { login } = useContext(AuthContext);

  const { password, username } = inputState;
  const setErrorData = useAlertStore((state) => state.setErrorData);
  function handleInput({
    target: { name, value },
  }: inputHandlerEventType): void {
    setInputState((prev) => ({ ...prev, [name]: value }));
  }

  const { mutate } = useLoginUser();

  function signIn() {
    const user: LoginType = {
      username: username,
      password: password,
    };

    mutate(user, {
      onSuccess: (res) => {
        login(res.access_token, "login", res.refresh_token);
      },
      onError: (error) => {
        setErrorData({
          title: SIGNIN_ERROR_ALERT,
          list: [error["response"]["data"]["detail"]],
        });
      },
    });
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-amber-900/20">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-6">
            <CustomLink to="/login">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Button>
            </CustomLink>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <img
                src={AxieStudioLogo}
                alt="Axie Studio logo"
                className="mx-auto mb-4 h-16 w-auto"
              />
              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Access
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Secure administrator login
            </p>
          </div>

          {/* Admin Login Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border-2 border-amber-200 dark:border-amber-800">
            <Form.Root
              onSubmit={(event) => {
                if (password === "") {
                  event.preventDefault();
                  return;
                }
                signIn();
                const _data = Object.fromEntries(new FormData(event.currentTarget));
                event.preventDefault();
              }}
              className="space-y-6"
            >
              {/* Security Notice */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Restricted Access</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  This area is for authorized administrators only
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Form.Field name="username">
                    <Form.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Username <span className="text-red-500">*</span>
                    </Form.Label>
                    <Form.Control asChild>
                      <Input
                        type="username"
                        onChange={({ target: { value } }) => {
                          handleInput({ target: { name: "username", value } });
                        }}
                        value={username}
                        className="w-full border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                        required
                        placeholder="Enter admin username"
                      />
                    </Form.Control>
                    <Form.Message match="valueMissing" className="text-red-500 text-sm mt-1">
                      Please enter your admin username
                    </Form.Message>
                  </Form.Field>
                </div>

                <div>
                  <Form.Field name="password">
                    <Form.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Password <span className="text-red-500">*</span>
                    </Form.Label>
                    <InputComponent
                      onChange={(value) => {
                        handleInput({ target: { name: "password", value } });
                      }}
                      value={password}
                      isForm
                      password={true}
                      required
                      placeholder="Enter admin password"
                      className="w-full border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                    <Form.Message className="text-red-500 text-sm mt-1" match="valueMissing">
                      Please enter your admin password
                    </Form.Message>
                  </Form.Field>
                </div>

                <Form.Submit asChild>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    type="submit"
                  >
                    <Shield className="w-4 h-4" />
                    Access Admin Panel
                  </Button>
                </Form.Submit>
              </div>
            </Form.Root>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                All admin activities are logged and monitored
              </p>
            </div>
          </div>

          {/* Security Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Having trouble? Contact{" "}
              <a
                href="mailto:admin@axiestudio.se"
                className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
              >
                admin@axiestudio.se
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
