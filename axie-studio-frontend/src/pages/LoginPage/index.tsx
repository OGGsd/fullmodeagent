import * as Form from "@radix-ui/react-form";
import { useContext, useState } from "react";
import AxieStudioLogo from "@/assets/AxieStudioLogo.jpg";
import { useLoginUser } from "@/controllers/API/queries/auth";
import { CustomLink } from "@/customization/components/custom-link";
import InputComponent from "../../components/core/parameterRenderComponent/components/inputComponent";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SIGNIN_ERROR_ALERT } from "../../constants/alerts_constants";
import { CONTROL_LOGIN_STATE } from "../../constants/constants";
import { AuthContext } from "../../contexts/authContext";
import useAlertStore from "../../stores/alertStore";
import type { LoginType } from "../../types/api";
import type {
  inputHandlerEventType,
  loginInputStateType,
} from "../../types/components";
import { Shield, User } from "lucide-react";

export default function LoginPage(): JSX.Element {
  const [inputState, setInputState] =
    useState<loginInputStateType>(CONTROL_LOGIN_STATE);

  const { password, username } = inputState;
  const { login } = useContext(AuthContext);
  const setErrorData = useAlertStore((state) => state.setErrorData);

  function handleInput({
    target: { name, value },
  }: inputHandlerEventType): void {
    setInputState((prev) => ({ ...prev, [name]: value }));
  }

  const { mutate } = useLoginUser();

  function signIn() {
    const user: LoginType = {
      username: username.trim(),
      password: password.trim(),
    };

    mutate(user, {
      onSuccess: (data) => {
        login(data.access_token, "login", data.refresh_token);
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
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src={AxieStudioLogo}
              alt="Axie Studio logo"
              className="mx-auto mb-4 h-16 w-auto"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to Axie Studio
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Professional AI Workflow Platform
            </p>
          </div>

          {/* Login Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-6">
                Choose Login Type
              </h2>

              {/* User Login Button */}
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
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div>
                    <Form.Field name="username">
                      <Form.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username <span className="text-red-500">*</span>
                      </Form.Label>
                      <Form.Control asChild>
                        <Input
                          type="username"
                          onChange={({ target: { value } }) => {
                            handleInput({ target: { name: "username", value } });
                          }}
                          value={username}
                          className="w-full"
                          required
                          placeholder="Enter your username"
                        />
                      </Form.Control>
                      <Form.Message match="valueMissing" className="text-red-500 text-sm mt-1">
                        Please enter your username
                      </Form.Message>
                    </Form.Field>
                  </div>

                  <div>
                    <Form.Field name="password">
                      <Form.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password <span className="text-red-500">*</span>
                      </Form.Label>
                      <InputComponent
                        onChange={(value) => {
                          handleInput({ target: { name: "password", value } });
                        }}
                        value={password}
                        isForm
                        password={true}
                        required
                        placeholder="Enter your password"
                        className="w-full"
                      />
                      <Form.Message className="text-red-500 text-sm mt-1" match="valueMissing">
                        Please enter your password
                      </Form.Message>
                    </Form.Field>
                  </div>

                  <Form.Submit asChild>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      type="submit"
                    >
                      <User className="w-4 h-4" />
                      Sign in as User
                    </Button>
                  </Form.Submit>
                </div>
              </Form.Root>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    or
                  </span>
                </div>
              </div>

              {/* Admin Login Button */}
              <CustomLink to="/login/admin">
                <Button
                  variant="outline"
                  className="w-full border-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin Login
                </Button>
              </CustomLink>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Secure login powered by Axie Studio
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Contact{" "}
              <a
                href="mailto:support@axiestudio.se"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                support@axiestudio.se
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
