import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postStoragePresignedUrlMutation, getStorageConfigOptions } from "@/api/@tanstack/react-query.gen";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, Upload } from "lucide-react";

interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    type: "user" | "organization";
    fallback: string;
}

export function ImageUpload({ value, onChange, type, fallback }: ImageUploadProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Mutation to get presigned URL
    const { mutateAsync: getPresignedUrl } = useMutation({
        ...postStoragePresignedUrlMutation(),
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const { data } = await getPresignedUrl({
                body: {
                    filename: file.name,
                    contentType: file.type,
                    type: type,
                },
            });

            if (!data?.uploadUrl) {
                throw new Error("Failed to get upload URL");
            }

            // Upload to S3
            // Note: We use raw axios here to avoid base URL / interceptor issues with the presigned URL
            await axios.put(data.uploadUrl, file, {
                headers: {
                    "Content-Type": file.type,
                },
            });

            // Calculate public URL (remove query params)
            const publicUrl = data.uploadUrl.split("?")[0];
            onChange(publicUrl);
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload image");
        } finally {
            setIsLoading(false);
        }
    };

    // Check if storage is enabled
    const { data: config } = useQuery({
        ...getStorageConfigOptions(),
    });

    const isEnabled = config?.data?.enabled ?? false;

    return (
        <div className="flex items-center gap-4">
            {type === "organization" ? (
                <div className="flex size-12 items-center justify-center rounded-lg border bg-background overflow-hidden">
                    {value ? (
                        <img src={value} alt={fallback} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-lg font-semibold">{fallback}</span>
                    )}
                </div>
            ) : (
                <Avatar className="h-12 w-12">
                    <AvatarImage src={value} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
            )}
            {isEnabled && (
                <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="relative cursor-pointer" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? "Uploading..." : "Upload Image"}
                        <Input
                            type="file"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            onChange={handleFileChange}
                            accept="image/*"
                            disabled={isLoading}
                        />
                    </Button>
                </div>
            )}
        </div>
    );
}
