import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const galleryDirectory = resolve(process.cwd(), "public/images/gallery");
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);

export type GalleryImage = {
    name: string;
    src: string;
};

export const getGalleryImages = async (): Promise<GalleryImage[]> => {
    let entries;

    try {
        entries = await readdir(galleryDirectory, { withFileTypes: true });
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }

        throw error;
    }

    return entries
        .filter((entry) => {
            const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();

            return entry.isFile() && imageExtensions.has(extension);
        })
        .sort((a, b) => b.name.localeCompare(a.name, "zh-CN"))
        .map((entry) => ({
            name: entry.name,
            src: `/images/gallery/${encodeURIComponent(entry.name)}`,
        }));
};
