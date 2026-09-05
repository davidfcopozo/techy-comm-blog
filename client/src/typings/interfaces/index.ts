import { FormEvent, HTMLAttributes, MouseEvent, ReactNode } from "react";
import { AxiosError } from "axios";
import { LucideIcon } from "lucide-react";
import { AuthAction, PostType, UserType } from "../types";
import { Socket } from "socket.io-client";

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export interface BaseDocument {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInterface extends BaseDocument {
  name: String;
  postedBy: string;
  slug: String;
  topic: string;
  usageCount: Number;
}

export interface SocialMediaProfilesInterface {
  x?: string;
  instagram?: string;
  github?: string;
  linkedIn?: string;
  dribble?: string;
}

export interface PostInterface extends BaseDocument {
  _id: string;
  title: string;
  content: string;
  slug: string;
  postedBy: string;
  coverImage?: string;
  likes?: string[];
  bookmarks?: string[];
  likesCount: number;
  bookmarksCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tags?: string[];
  categories?: CategoryInterface[];
  visits?: number;
  comments?: string[];
  status: "draft" | "published" | "unpublished";
}

export interface TopicInterface extends BaseDocument {
  name: String;
  postedBy: string;
  description: String;
}

export interface UserInterface extends BaseDocument {
  firstName: String;
  lastName: String;
  email: String;
  password: String;
  username: String;
  website?: String;
  bio?: String;
  title?: String;
  role: String;
  verificationToken?: String;
  verified?: Boolean;
  verifiedAt?: Date;
  accessToken: String | null;
  passwordVerificationToken: String | null;
  passwordTokenExpirationDate: Date | null;
  bookmarks?: string[];
  likes?: string[];
  avatar?: String;
  provider: String;
  locale: String;
  topicsOfInterest?: TopicInterface[];
  technologies?: CategoryInterface[];
  socialMediaProfiles?: SocialMediaProfilesInterface;
  isOnboarded: Boolean;
  following?: string[];
  followers?: string[];
}

export interface CustomBadgeProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  uniQueKey: string | number;
  onRemove?: () => void;
  classes?: string;
}

export interface EditorProps {
  value: string;
  onChange: (content: string) => void;
  handleImageUpload: (file: File) => Promise<string>;
  onEditorReady?: () => void;
}

export interface NewPostLayoutProps {
  children: ReactNode;
  onSave: (e: FormEvent) => void;
}

export interface NewPostHeaderProps {
  onSave: (status: "draft" | "published" | "unpublished") => void;
  currentStatus?: "draft" | "published" | "unpublished";
  hasChanges?: boolean;
  isSaving?: boolean;
  slug?: string;
  onPreview?: () => void;
  hasContent?: boolean;
  onBack?: () => void;
}

export interface BlogEditorProps {
  initialPost?: InitialPost | null;
  slug?: string;
  isPostLoading?: boolean;
}

export interface InitialPost {
  _id?: string;
  title: string;
  content: string;
  coverImage: string | null;
  categories?: CategoryInterface[];
  tags?: string[];
  status?: "draft" | "published" | "unpublished";
}

export interface UseBlogEditorProps {
  initialPost?: InitialPost | null;
  slug?: string | null;
}

export interface CoverImageProps {
  imageUrl: string | null;
  temporaryCoverImage: File | null;
  onUpload: (file: File | null) => void;
}

export interface CommentInterface {
  _id: string;
  postedBy: string;
  post: string;
  parentId?: string;
  content: string;
  replies: string[];
  likes: string[];
  likesCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  isReply: boolean;
}

export interface ReplyInterface {
  _id: string;
  postedBy: string;
  post: string;
  content: string;
  parentId: string;
  replies: string[];
  likes: string[];
  likesCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  isReply: boolean;
}

export interface MutationContext<TData> {
  previousData?: TData;
  newData?: TData;
}

export interface UseMutationRequestProps<TData, TVariables> {
  url: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (
    error: AxiosError,
    variables: TVariables,
    context: MutationContext<TData> | undefined
  ) => void;
  onMutate?: (variables: TVariables) => Promise<MutationContext<TData>>;
  onSettled?: (
    data: TData | undefined,
    error: AxiosError | null,
    variables: TVariables,
    context: MutationContext<TData> | undefined
  ) => void;
}

export interface CommentEditorProps {
  onSubmit: (newItem: any) => void;
  onCancel?: () => void;
  onChange: (e: string) => void;
  placeholder?: string;
  maxHeight?: number;
  showCancelButton: boolean;
  value: string;
  commentMutationStatus: string;
  originalContent?: string;
}

export interface NestedCommentProps {
  comment: CommentInterface;
  post: any;
  level?: number;
  onMaxNestingReached?: () => void;
}

export interface UseBulkFetchProps {
  ids: string[];
  key: string;
  dependantItem?: boolean;
  url: string;
}

export interface EngagementButtonProps {
  icon: LucideIcon;
  count?: number;
  label: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  extraClasses?: string;
  iconStyles?: string;
  activeColor?: string;
  isActivated?: boolean;
  horizontalCount?: boolean;
  disabled?: boolean;
  title?: string;
}

export interface BlogPostProps {
  slug?: string;
  handleLikeClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  handleBookmarkClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  liked?: boolean;
  bookmarked?: boolean;
  amountOfBookmarks?: number;
  amountOfLikes?: number;
  post?: PostType;
  isPreview?: boolean;
}

export interface SocialMediaConfig {
  icon: LucideIcon;
  getUrl: (username: string) => string;
  label: string;
}

export interface AuthorPanelProps {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatar: string;
  bio: string;
  website: string;
  title: string;
  socialMedia: UserType["socialMediaProfiles"];
  handleFollowToggle: () => void;
  isFollowed: boolean;
  isPending: boolean;
  isPostOwner?: boolean;
  isPreview?: boolean;
}

export interface ImageFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  dimensions: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
  title: string;
  altText: string;
  tags: string[];
}

export interface UploadProgress {
  id: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export interface ImageInterface {
  _id: string;
  url: string;
  name: string;
  title: string;
  altText: string;
  tags: string[];
  hash: string;
  postedBy?: string;
  createdAt: Date;
  size: number;
  type: string;
  dimensions: string;
}

export interface ImageCardPropsInterface {
  image: ImageInterface;
  isSelected: boolean;
  onSelect: () => void;
}

export interface ImageGalleryPropsInterface {
  images: ImageInterface[];
  selectedImage: ImageInterface | null;
  onSelect: (image: ImageInterface) => void;
  onDoubleClick?: (image: ImageInterface) => void;
}

export interface ImageInfoPanelPropsInterface {
  image: ImageInterface | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ImageInterface>) => void;
}

export interface GeoLocationResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
  proxy: boolean;
  hosting: boolean;
  mobile: boolean;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: AuthAction;
  onSuccess?: () => void;
}

export interface SVGToolbarIcons {
  [key: string]:
    | string
    | {
        [subKey: string]: string;
      };
}

export interface QuillHistoryHandler {
  undo: () => void;
  redo: () => void;
}

export interface DeleteImageProps {
  itemId: string;
  key?: string;
}

export interface ImageMetadata extends Omit<ImageInterface, "_id"> {
  hash: string;
}

export interface CommentNavigationGuardOptions {
  content: string;
  originalContent?: string;
  isEditing?: boolean;
  onSave?: () => Promise<void>;
  enabled?: boolean;
}

export interface NavigationGuardOptions {
  hasUnsavedChanges: boolean;
  message?: string;
  onBeforeUnload?: () => void;
  onSave?: () => Promise<void>;
  autoSave?: () => Promise<void>;
  enableDialog?: boolean;
}

export interface NotificationPreferencesInterface {
  mentions: {
    inApp: boolean;
    email: boolean;
  };
  comments: {
    inApp: boolean;
    email: boolean;
  };
  replies: {
    inApp: boolean;
    email: boolean;
  };
  bookmarks: {
    inApp: boolean;
    email: boolean;
  };
  likes: {
    inApp: boolean;
    email: boolean;
  };
  follows: {
    inApp: boolean;
    email: boolean;
  };
}

export interface Notification {
  id?: string;
  _id?: string;
  type: "mention" | "comment" | "reply" | "bookmark" | "like" | "follow";
  message: string;
  sender: {
    firstName: string;
    lastName: string;
    username: string;
    avatar: string;
  };
  relatedPost?:
    | string
    | {
        _id: string;
        slug?: string;
        title?: string;
        postedBy?: {
          username: string;
        };
      };
  relatedComment?: string | { _id: string; content?: string };
  isRead: boolean;
  createdAt: string;
}

export interface DashboardNavProps {
  activeTab: string;
  handleTabChange: (tab: string) => void;
  isMobile?: boolean;
}
