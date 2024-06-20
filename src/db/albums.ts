import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { Key } from "react";

export interface Album {
  public_id: string[];
  filename: string | undefined;
  blurDataUrl: string | undefined;
  asset_id: Key | null | undefined;
  secure_url?: string | StaticImport;
  name: string;
  artist: string;
  cover: string;
}

export const listenNowAlbums: Album[] = [
  {
    name: "React Rendezvous",
    artist: "Ethan Byte",
    cover:
      "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
  {
    name: "Async Awakenings",
    artist: "Nina Netcode",
    cover:
      "https://images.unsplash.com/photo-1468817814611-b7edf94b5d60?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
  {
    name: "The Art of Reusability",
    artist: "Lena Logic",
    cover:
      "https://images.unsplash.com/photo-1528143358888-6d3c7f67bd5d?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
  {
    name: "Stateful Symphony",
    artist: "Beth Binary",
    cover:
      "https://images.unsplash.com/photo-1490300472339-79e4adc6be4a?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
];

export const madeForYouAlbums: Album[] = [
  {
    name: "Thinking Components",
    artist: "Lena Logic",
    cover:
      "https://images.unsplash.com/photo-1615247001958-f4bc92fa6a4a?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
  {
    name: "Functional Fury",
    artist: "Beth Binary",
    cover:
      "https://images.unsplash.com/photo-1513745405825-efaf9a49315f?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
  {
    name: "React Rendezvous",
    artist: "Ethan Byte",
    cover:
      "https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
  {
    name: "Stateful Symphony",
    artist: "Beth Binary",
    cover:
      "https://images.unsplash.com/photo-1446185250204-f94591f7d702?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
  {
    name: "Async Awakenings",
    artist: "Nina Netcode",
    cover:
      "https://images.unsplash.com/photo-1468817814611-b7edf94b5d60?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
  {
    name: "The Art of Reusability",
    artist: "Lena Logic",
    cover:
      "https://images.unsplash.com/photo-1490300472339-79e4adc6be4a?w=300&dpr=2&q=80",
    asset_id: undefined,
    secure_url: undefined,
    blurDataUrl: undefined,
    filename: undefined,
    public_id: [],
  },
];
