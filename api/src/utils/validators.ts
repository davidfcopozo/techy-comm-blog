const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const usernameRegex =
  /^(?=[a-zA-Z])[a-zA-Z0-9]*[_-]?[a-zA-Z0-9]+[_-]?[a-zA-Z0-9]{3,}$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const websiteRegex =
  /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([\/\w \.-]*)*\/?$/;
const topicNameRegex = /^[a-zA-Z0-9]+[a-zA-Z0-9-_ ]{0,48}[a-zA-Z0-9]+$/;
const topicDescriptionRegex = /^[a-zA-Z0-9]+[a-zA-Z0-9-_ ]{5,96}[a-zA-Z0-9]+$/;
const categoryNameRegex = /^[a-zA-Z0-9]+[a-zA-Z0-9-_ ]{0,48}[a-zA-Z0-9]+$/;

type StringProp = string;

export const isValidEmail = (email: StringProp) => {
  return emailRegex.test(email);
};

export const isValidUsername = (username: StringProp) => {
  return usernameRegex.test(username);
};

export const slugValidator = (slug: StringProp) => {
  return slugRegex.test(slug);
};

export const websiteValidator = (web: StringProp) => {
  return websiteRegex.test(web);
};

export const topicNameValidator = (topic: StringProp) => {
  return topicNameRegex.test(topic);
};

export const topicDescriptionValidator = (description: StringProp) => {
  return topicDescriptionRegex.test(description);
};

export const categoryValidator = (name: StringProp) => {
  return categoryNameRegex.test(name);
};

export const validateImageUrl = (url: string): boolean => {
  try {
    if (!url || typeof url !== "string") {
      return false;
    }

    // Supabase Storage URL validation
    const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "images";
    const supabaseUrl = process.env.SUPABASE_URL;

    if (supabaseUrl) {
      const cleanUrl = supabaseUrl.replace(/\/$/, "");
      const customSupabasePattern = new RegExp(
        `^${cleanUrl.replace(/\./g, "\\.")}/storage/v1/object/public/${supabaseBucket}/.+$`
      );
      if (customSupabasePattern.test(url)) {
        return true;
      }
    }

    // Generic Supabase storage public URL pattern
    const genericSupabasePattern =
      /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/[a-zA-Z0-9-_./%]+$/;
    if (genericSupabasePattern.test(url)) {
      return true;
    }

    // Firebase Storage backwards compatibility
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (bucketName) {
      const firebaseUrlPattern = new RegExp(
        `^https://firebasestorage\\.googleapis\\.com/v0/b/${bucketName.replace(
          /\./g,
          "\\."
        )}/o/.+\\?alt=media&token=[a-zA-Z0-9-]+$`
      );
      if (firebaseUrlPattern.test(url)) {
        return true;
      }
    }

    const genericFirebasePattern =
      /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[a-zA-Z0-9-_.]+\/o\/.+\?alt=media&token=[a-zA-Z0-9-]+$/;
    if (genericFirebasePattern.test(url)) {
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(error.message);
    return false;
  }
};
