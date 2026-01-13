import Layout from "@/layout";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import TimezoneSelector from "../../components/TimezoneSelector";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getSettingsKeyByKeyOptions,
    putSettingsKeyByKeyMutation,
    getSettingsKeyByKeyQueryKey,
    putAuthProfileMutation,
} from "@/api/@tanstack/react-query.gen";
import React from "react";
import { commonMutationErrorHandler } from "@/lib/utils";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { ImageUpload } from "@/components/image-upload";
import { useAuthStore } from "@/store/auth";

const AccountSettings = () => {
    const { t } = useLocalizedTranslation();
    const { user, setUser } = useAuthStore();

    const formSchema = z.object({
        name: z.string().min(3),
        image_url: z.string().optional(),
    });

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: user?.name || "",
            image_url: user?.imageUrl || "",
        },
    });

    React.useEffect(() => {
        if (user) {
            form.reset({
                name: user.name || "",
                image_url: user.imageUrl || "",
            });
        }
    }, [user, form]);

    const mutation = useMutation({
        ...putAuthProfileMutation(),
        onSuccess: (_, variables) => {
            toast.success("Profile updated successfully");
            if (user) {
                setUser({
                    ...user,
                    name: variables.body.name,
                    imageUrl: variables.body.image_url,
                });
            }
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to update profile");
        }
    });

    function onSubmit(values: { name: string; image_url?: string }) {
        mutation.mutate({
            body: values
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Update your profile information.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
                        <FormField
                            control={form.control}
                            name="image_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profile Picture</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            type="user"
                                            fallback={user?.name?.charAt(0).toUpperCase() || "U"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Your name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

const KeepDataPeriodSetting = () => {
    const { t } = useLocalizedTranslation();
    const keepDataPeriodSchema = z.object({
        value: z.coerce
            .number()
            .int()
            .min(1, { message: t("settings.validation.min_days") }),
    });
    const KEEP_DATA_KEY = "KEEP_DATA_PERIOD_DAYS";
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery(
        getSettingsKeyByKeyOptions({ path: { key: KEEP_DATA_KEY } })
    );

    const form = useForm({
        resolver: zodResolver(keepDataPeriodSchema),
        defaultValues: { value: 365 },
    });

    // Reset form when data is loaded
    React.useEffect(() => {
        if (data?.data?.value) {
            form.reset({ value: Number(data.data.value) });
        }
    }, [data, form]);

    const mutation = useMutation({
        ...putSettingsKeyByKeyMutation(),
        onSuccess: () => {
            toast.success(t("messages.setting_update_success"));
            queryClient.invalidateQueries({
                queryKey: getSettingsKeyByKeyQueryKey({
                    path: { key: KEEP_DATA_KEY },
                }),
            });
        },
        onError: commonMutationErrorHandler(t("messages.setting_update_error")),
    });

    function onSubmit(values: { value: number }) {
        mutation.mutate({
            path: { key: KEEP_DATA_KEY },
            body: { type: "int", value: String(values.value) },
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("settings.data_retention.title")}</CardTitle>
                <CardDescription>
                    {t("settings.data_retention.description")}
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="h-10 flex items-center">{t("common.loading")}</div>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex gap-2 items-end max-w-xs"
                        >
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.data_retention.days_label")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={mutation.isPending || isLoading}>
                                {mutation.isPending ? t("common.saving") : t("common.save")}
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
};

const SettingsPage = () => {
    const { t } = useLocalizedTranslation();
    return (
        <Layout pageName={t("navigation.settings")}>
            <div className="max-w-xl flex flex-col gap-6">
                <AccountSettings />
                <Card>
                    <CardHeader>
                        <CardTitle>{t("settings.timezone.title")}</CardTitle>
                        <CardDescription>
                            {t("settings.timezone.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TimezoneSelector />
                    </CardContent>
                </Card>
                <KeepDataPeriodSetting />
            </div>
        </Layout>
    );
};

export default SettingsPage;
