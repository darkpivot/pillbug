import { createSignal, JSX, type Component } from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";
import { useNavigate } from "@solidjs/router";
import { logOut, tryGetAuthenticatedClient } from "./App";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarTrigger,
} from "./components/ui/menubar";
import { Button } from "./components/ui/button";
import EditOverlay from "./views/editoverlay";
import { AuthProviderProps, useAuthContext } from "./lib/auth-context";
import { useEditOverlayContext } from "./lib/edit-overlay-context";

export const initAppFrameAsync = async (authContext: AuthProviderProps) => {
    try {
        const client = await tryGetAuthenticatedClient(authContext);
        if (client !== null) {
            const instanceInfo = await client.getInstance();
            if (instanceInfo.status !== 200) {
                throw new Error(
                    `Failed to get instance info: ${instanceInfo.statusText}`
                );
            }
            const creds = await client.verifyAccountCredentials();
            if (creds.status !== 200) {
                throw new Error(
                    `Failed to get current user info: ${creds.statusText}`
                );
            }
            console.log(`signed in to instance ${instanceInfo.data.uri}`);
            let domain = instanceInfo.data.uri;
            try {
                domain = new URL(instanceInfo.data.uri).hostname;
            } catch {}
            authContext.setAuthState("signedIn", {
                authenticatedClient: client,
                instanceData: instanceInfo.data,
                accountData: creds.data,
                domain: domain,
            });
        } else {
            authContext.setAuthState("signedIn", false);
        }
    } catch (error) {
        if (error instanceof Error) {
            alert(`Error loading page: ${error.message}`);
        }
    }
};

const AppFrame: Component<{ children: JSX.Element }> = (props) => {
    const authContext = useAuthContext();
    const editingOverlayContext = useEditOverlayContext();
    const [busy, setBusy] = createSignal(true);

    const init = async () => {
        const authContext = useAuthContext();
        await initAppFrameAsync(authContext);
        setBusy(false);
    };

    init();

    const navigate = useNavigate();

    return (
        <div>
            <EditOverlay></EditOverlay>
            <div class="sticky top-0 z-40 w-full backdrop-blur flex-none">
                <div class="max-w-8xl mx-auto">
                    <div class="border-b border-slate-900/10 lg:px-8 lg:border-0 dark:border-slate-300/10 mx-4 lg:mx-0 flex flex-row">
                        <div
                            class="flex-0 p-4 cursor-pointer"
                            onClick={() => navigate("/")}
                        >
                            <span class="text-lg">pillbug</span>{" "}
                            <span class="text-xs">pre-alpha</span>
                        </div>
                        <div class="flex-1 py-4"></div>
                        {authContext.authState.signedIn !== null &&
                            authContext.authState.signedIn !== false && (
                                <>
                                    <div class="flex-0 py-4">
                                        <Menubar>
                                            <MenubarMenu>
                                                <MenubarTrigger>
                                                    {`${authContext.authState.signedIn.accountData.username}@${authContext.authState.signedIn.domain}`}
                                                </MenubarTrigger>
                                                <MenubarContent>
                                                    {authContext.authState
                                                        .signedIn && (
                                                        <MenubarItem
                                                            onClick={() => {
                                                                logOut(
                                                                    authContext
                                                                );
                                                                navigate("/");
                                                            }}
                                                        >
                                                            Log out
                                                        </MenubarItem>
                                                    )}

                                                    <MenubarItem
                                                        onClick={() => {
                                                            if (
                                                                window.localStorage.getItem(
                                                                    "theme"
                                                                ) === "dark" ||
                                                                (localStorage.getItem(
                                                                    "theme"
                                                                ) === null &&
                                                                    window.matchMedia(
                                                                        "(prefers-color-scheme: dark)"
                                                                    ).matches)
                                                            ) {
                                                                console.log(
                                                                    "switch to light theme"
                                                                );
                                                                window.localStorage.setItem(
                                                                    "theme",
                                                                    "light"
                                                                );
                                                                document.documentElement.classList.remove(
                                                                    "dark"
                                                                );
                                                            } else {
                                                                console.log(
                                                                    "switch to dark theme"
                                                                );
                                                                window.localStorage.setItem(
                                                                    "theme",
                                                                    "dark"
                                                                );
                                                                document.documentElement.classList.add(
                                                                    "dark"
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Toggle light/dark
                                                    </MenubarItem>

                                                    <MenubarItem
                                                        onClick={() => {
                                                            logOut(authContext);
                                                            navigate(
                                                                "/dev/editDialog"
                                                            );
                                                        }}
                                                    >
                                                        Dev tools: edit dialog
                                                    </MenubarItem>
                                                </MenubarContent>
                                            </MenubarMenu>
                                        </Menubar>
                                    </div>
                                    <div class="flex-0 py-4 mx-4">
                                        <Button
                                            onClick={() =>
                                                editingOverlayContext.setShowingEditorOverlay(
                                                    true
                                                )
                                            }
                                        >
                                            Post
                                        </Button>
                                    </div>
                                </>
                            )}
                        {authContext.authState.signedIn === false && (
                            <div class="flex-0 py-4">
                                <Button
                                    onClick={() =>
                                        navigate("/login", {
                                            replace: true,
                                        })
                                    }
                                >
                                    Log in
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {busy() && (
                <div>
                    <span class="animate-spin">🤔</span>
                </div>
            )}
            {!busy() && props.children}
        </div>
    );
};

export default AppFrame;
