import { type FC, useEffect, useMemo, useState } from "react";
import IconComponent from "@/components/common/genericIconComponent";
import { Button } from "@/components/ui/button";
import { useGetUserData, useUpdateUser } from "@/controllers/API/queries/auth";
import ModalsComponent from "@/pages/MainPage/components/modalsComponent";
import useFlowsManagerStore from "@/stores/flowsManagerStore";
import type { Users } from "@/types/api";
import { cn } from "@/utils/utils";

interface CustomGetStartedProgressProps {
  userData: Users;
  isGithubStarred: boolean;
  isDiscordJoined: boolean;
  handleDismissDialog: () => void;
}

export const CustomGetStartedProgress: FC<CustomGetStartedProgressProps> = ({
  userData,
  isGithubStarred: isGithubStarredParent,
  isDiscordJoined: isDiscordJoinedParent,
  handleDismissDialog,
}) => {
  const [isGithubStarredChild, setIsGithubStarredChild] = useState(
    isGithubStarredParent,
  );
  const [isDiscordJoinedChild, setIsDiscordJoinedChild] = useState(
    isDiscordJoinedParent,
  );

  const { mutate: updateUser } = useUpdateUser();
  const { mutate: mutateLoggedUser } = useGetUserData();
  const flows = useFlowsManagerStore((state) => state.flows);

  const hasFlows = flows && flows?.length > 0;

  const percentageGetStarted = useMemo(() => {
    // Only count flows for completion since we removed social links
    return hasFlows ? 100 : 0;
  }, [hasFlows]);

  return (
    <div className="mt-3 h-[10.8rem] w-full">
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-sm font-medium"
          data-testid="get_started_progress_title"
        >
          {percentageGetStarted >= 100 ? (
            <>
              <span>All Set</span> <span className="pl-1"> 🎉 </span>
            </>
          ) : (
            "Get started"
          )}
        </span>
        <button
          onClick={() => handleDismissDialog()}
          className="text-muted-foreground hover:text-foreground"
          data-testid="close_get_started_dialog"
        >
          <IconComponent name="X" className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-accent-emerald-foreground transition-all duration-300 ease-in-out"
          style={{ width: `${percentageGetStarted}%` }}
          data-testid="get_started_progress_bar"
        />
      </div>

      <div className="space-y-2">
        {/* Create a flow task */}
        <div className="flex items-center gap-2 rounded-md px-2 py-[10px]">
          {hasFlows ? (
            <span data-testid="create_flow_icon_get_started">
              <IconComponent
                name="Check"
                className="h-4 w-4 text-accent-emerald-foreground"
              />
            </span>
          ) : (
            <IconComponent name="Plus" className="h-4 w-4" />
          )}
          <span
            className={cn(
              "text-sm",
              hasFlows && "text-muted-foreground line-through",
            )}
          >
            Create a flow
          </span>
        </div>

        {/* Welcome message when completed */}
        {percentageGetStarted >= 100 && (
          <div className="mt-4 rounded-md bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              Welcome to Axie Studio! You're all set to start building AI workflows.
            </p>
          </div>
        )}
      </div>

      <ModalsComponent />
    </div>
  );
};

export default CustomGetStartedProgress;
