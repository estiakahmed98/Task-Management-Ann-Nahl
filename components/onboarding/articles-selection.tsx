"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { StepProps } from "@/types/onboarding";

export function ArticlesSelection({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: StepProps) {
  const articles = [
    { id: 1, title: "How to Optimize Your Website for Search Engines" },
    { id: 2, title: "The Importance of Social Media Marketing in 2023" },
    { id: 3, title: "10 Tips for Creating Engaging Content" },
    { id: 4, title: "Building Your Personal Brand Online" },
    { id: 5, title: "Email Marketing Strategies That Actually Work" },
    { id: 6, title: "Understanding Analytics to Grow Your Business" },
    { id: 7, title: "The Power of Video Content in Digital Marketing" },
    { id: 8, title: "How to Create a Content Calendar for Your Business" },
    { id: 9, title: "Leveraging User-Generated Content for Brand Growth" },
    { id: 10, title: "Mobile Optimization: Why It Matters More Than Ever" },
    { id: 11, title: "The Future of E-commerce: Trends to Watch" },
    { id: 12, title: "Building Customer Loyalty in the Digital Age" },
  ];

  const toggleArticle = (articleId: number) => {
    const currentSelection = [...formData.selectedArticles];
    const index = currentSelection.indexOf(articleId);

    if (index === -1) {
      currentSelection.push(articleId);
    } else {
      currentSelection.splice(index, 1);
    }

    updateFormData({ selectedArticles: currentSelection });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Select Articles</h1>
        <p className="text-gray-500 mt-2">
          Choose articles you&apos;d like us to generate for your content
          strategy.
        </p>
      </div>

      <div>
        <div className="grid grid-cols-1 gap-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-start space-x-3 p-4 border rounded-md hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                id={`article-${article.id}`}
                checked={formData.selectedArticles.includes(article.id)}
                onCheckedChange={() => toggleArticle(article.id)}
              />
              <div className="-mt-1">
                <Label
                  htmlFor={`article-${article.id}`}
                  className="text-base mb-1 font-medium cursor-pointer"
                >
                  {article.title}
                </Label>
                <p className="text-sm text-gray-500">
                  A comprehensive article about {article.title.toLowerCase()}.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
