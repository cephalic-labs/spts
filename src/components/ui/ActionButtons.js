"use client";

import { Icons } from "@/components/layout";

export default function ActionButtons({ onEdit, onDelete, editTitle = "Edit", deleteTitle = "Delete" }) {
  return (
    <div className="flex justify-end gap-2">
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title={editTitle}
        >
          <Icons.Edit />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title={deleteTitle}
        >
          <Icons.Trash />
        </button>
      )}
    </div>
  );
}
