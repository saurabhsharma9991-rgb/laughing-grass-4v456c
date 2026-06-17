import { parseTagsInput } from "@/lib/utils/tags.js";

export function validateCreateListing(body) {
  const errors = {};
  if (!body?.title?.trim()) errors.title = "Title is required.";
  if (Object.keys(errors).length) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    data: {
      title: body.title.trim(),
      org: body.org?.trim() || null,
      location: body.location?.trim() || null,
      pay: body.pay?.trim() || null,
      description: body.description?.trim() || null,
      type: body.type?.trim() || "One-time",
      badge: body.badge?.trim() || "New",
      tags: parseTagsInput(body.tags),
      status: body.status?.trim() || "open",
    },
  };
}

export function validateUpdateListing(body) {
  const errors = {};
  if (body.title !== undefined && !body.title?.trim()) {
    errors.title = "Title cannot be empty.";
  }
  if (Object.keys(errors).length) {
    return { valid: false, errors };
  }

  const data = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.org !== undefined) data.org = body.org?.trim() || null;
  if (body.location !== undefined) data.location = body.location?.trim() || null;
  if (body.pay !== undefined) data.pay = body.pay?.trim() || null;
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.type !== undefined) data.type = body.type?.trim() || "One-time";
  if (body.badge !== undefined) data.badge = body.badge?.trim() || "New";
  if (body.status !== undefined) data.status = body.status?.trim() || "open";
  if (body.tags !== undefined) data.tags = parseTagsInput(body.tags);

  return { valid: true, data };
}

