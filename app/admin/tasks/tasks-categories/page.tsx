"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ListChecks,
  Save,
  FileText,
  Tag,
  Edit2,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TaskCategory = {
  id: string;
  name: string;
  description?: string | null;
  tasks?: { id: string }[];
};

export default function TaskCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(
    null
  );
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/task-categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data: TaskCategory[] = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load task categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      await fetch(`/api/task-categories/${selectedCategory.id}`, {
        method: "DELETE",
      });
      setCategories(categories.filter((c) => c.id !== selectedCategory.id));
      setDeleteConfirm(false);
      toast.success("Category deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      const isNew = !selectedCategory.id;
      const method = isNew ? "POST" : "PUT";
      const url = isNew
        ? "/api/task-categories"
        : `/api/task-categories/${selectedCategory.id}`;

      const payload = isNew
        ? {
            name: selectedCategory.name,
            description: selectedCategory.description,
          }
        : selectedCategory;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save category");
      const updated = await res.json();

      if (isNew) {
        setCategories([...categories, updated]);
      } else {
        setCategories(
          categories.map((c) => (c.id === updated.id ? updated : c))
        );
      }

      setEditMode(false);
      toast.success(`Category ${isNew ? "created" : "updated"} successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-3xl font-bold text-gray-800">Task Categories</h1>
        <div className="flex gap-4 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              className="pl-9 w-[250px] border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md"
            onClick={() => {
              setSelectedCategory({ id: "", name: "", description: "" });
              setEditMode(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-lg font-medium mb-2">No categories found.</p>
          <p className="text-sm">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={() => {
                setSelectedCategory(cat);
                setEditMode(true);
              }}
              onDelete={() => {
                setSelectedCategory(cat);
                setDeleteConfirm(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-2xl rounded-2xl border-0 bg-white shadow-2xl dark:bg-gray-900 overflow-hidden p-0">
          {selectedCategory && (
            <form onSubmit={handleUpdate} className="space-y-0">
              <DialogHeader className="px-8 pt-8 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {selectedCategory.id === "new" ? (
                    <>
                      <PlusCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      <span>Create New Category</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      <span>Edit Category</span>
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="px-8 py-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Category Name
                  </Label>
                  <Input
                    value={selectedCategory.name}
                    onChange={(e) =>
                      setSelectedCategory({
                        ...selectedCategory,
                        name: e.target.value,
                      })
                    }
                    className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 transition-colors"
                    placeholder="Enter category name..."
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Description
                  </Label>
                  <Textarea
                    value={selectedCategory.description || ""}
                    onChange={(e) =>
                      setSelectedCategory({
                        ...selectedCategory,
                        description: e.target.value,
                      })
                    }
                    className="min-h-[120px] bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 transition-colors"
                    placeholder="Add a detailed description..."
                  />
                </div>
              </div>

              <DialogFooter className="px-8 py-5 bg-gray-50 dark:bg-gray-800/70 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-end gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 dark:border-gray-600 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/30 dark:shadow-blue-700/30 transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    {selectedCategory.id === "new" ? (
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Create Category</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        <span className="font-medium">Save Changes</span>
                      </span>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <p className="text-sm text-gray-600">
              This will permanently delete the category.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: TaskCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden border border-gray-100 shadow-md bg-white hover:shadow-lg transition">
      <CardHeader className="p-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50 flex justify-between">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-cyan-600" /> {category.name}
        </h3>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <p className="text-gray-600 text-sm">
          {category.description || "No description"}
        </p>
        <p className="text-xs text-gray-500">
          {category.tasks?.length || 0} tasks in this category
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t bg-gray-50 p-3">
        <Button size="icon" variant="outline" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
