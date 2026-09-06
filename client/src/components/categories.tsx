import {
  KeyboardEvent,
  SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { CategoryInterface } from "@/typings/interfaces";
import useFetchRequest from "@/hooks/useFetchRequest";
import { Skeleton } from "./ui/skeleton";
import { XIcon } from "./icons";
import { CategoriesProps } from "@/typings/types";
import { useTranslations } from "next-intl";
import { useToast } from "./ui/use-toast";

const normalizeString = (str: string | String) =>
  String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const Categories = ({
  setCategories,
  categories: passedCategories,
}: CategoriesProps) => {
  const t = useTranslations("editor");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const {
    data: fetchedCategories,
    isLoading,
    isFetching,
    error,
  } = useFetchRequest(["categories"], "/api/categories");
  const [availableCategories, setAvailableCategories] = useState<
    CategoryInterface[]
  >([]);
  const [showMore, setShowMore] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<
    CategoryInterface[]
  >([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [amountOfCategories, setAmountOfCategories] = useState(5);
  const [initialCategories, setInitialCategories] = useState<
    CategoryInterface[]
  >([]);

  const isInitialSetup = useRef(true);

  useEffect(() => {
    if (fetchedCategories?.data && Array.isArray(fetchedCategories.data)) {
      setInitialCategories(fetchedCategories.data);
      setAvailableCategories(fetchedCategories.data);

      if (isInitialSetup.current) {
        isInitialSetup.current = false;
      }
    }
  }, [fetchedCategories]);

  useEffect(() => {
    if (passedCategories.length > 0 && isInitialSetup.current === false) {
      const selected = passedCategories
        .map((category) => {
          return fetchedCategories?.data?.find(
            (cat: CategoryInterface) =>
              cat?._id?.toString() === category?._id?.toString()
          );
        })
        .filter(Boolean) as CategoryInterface[];

      const availableCats = fetchedCategories?.data?.filter(
        (category: CategoryInterface) =>
          !selected.find((selectedCat) => selectedCat._id === category._id)
      );

      setSelectedCategories(selected);
      setAvailableCategories(availableCats);
    }
  }, [passedCategories, fetchedCategories?.data]);

  const handleRemoveCategory = (category: CategoryInterface) => {
    setSelectedCategories((prevSelectedCategories) =>
      prevSelectedCategories.filter(
        (selectedCategory) => selectedCategory._id !== category._id
      )
    );

    setAvailableCategories((prevAvailableCategories) => {
      const updatedCategories = [...prevAvailableCategories, category];
      return updatedCategories.sort(
        (a, b) =>
          initialCategories.findIndex((cat) => cat._id === a._id) -
          initialCategories.findIndex((cat) => cat._id === b._id)
      );
    });

    setCategories((prevCategories: CategoryInterface[]) =>
      prevCategories.filter(
        (c: CategoryInterface) => c._id.toString() !== category._id.toString()
      )
    );
  };

  const handleAddCategory = (category: CategoryInterface) => {
    if (selectedCategories.some((c) => c._id === category._id)) {
      return;
    }
    setSelectedCategories((prevSelectedCategories) => [
      ...prevSelectedCategories,
      category,
    ]);

    setAvailableCategories((prevAvailableCategories) =>
      prevAvailableCategories.filter(
        (availableCategory) => availableCategory._id !== category._id
      )
    );
    setCategories((prevCategories: CategoryInterface[]) => [
      ...prevCategories,
      category,
    ]);
  };

  const showMoreCategories = () => {
    setShowMore(true);
    setAmountOfCategories(
      (prevAmountOfCategories) => prevAmountOfCategories + 5
    );
  };

  const showLessCategories = () => {
    setAmountOfCategories((prevAmountOfCategories) =>
      Math.max(prevAmountOfCategories - 5, 5)
    );
  };

  const filteredCategories = useMemo(() => {
    if (categorySearchQuery.trim() === "") {
      return availableCategories;
    }
    const normalizedQuery = normalizeString(categorySearchQuery);
    return (
      availableCategories &&
      availableCategories.filter((category) =>
        normalizeString(category.name).includes(normalizedQuery)
      )
    );
  }, [availableCategories, categorySearchQuery]);

  const handleAddCategoryFromSearch = (e: SyntheticEvent) => {
    e.preventDefault();
    const query = categorySearchQuery.trim();
    if (!query) return;

    const normalizedQuery = normalizeString(query);

    const isAlreadySelected = selectedCategories.some(
      (c) => normalizeString(c.name) === normalizedQuery
    );
    if (isAlreadySelected) {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: t("categoryAlreadyAdded"),
      });
      return;
    }

    const categoryToAdd =
      availableCategories.find(
        (c) => normalizeString(c.name) === normalizedQuery
      ) ||
      (filteredCategories && filteredCategories.length > 0
        ? filteredCategories[0]
        : null);

    if (categoryToAdd) {
      handleAddCategory(categoryToAdd);
      setCategorySearchQuery("");
    } else {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: t("categoryNotFound"),
      });
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddCategoryFromSearch(e);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("categories")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {isFetching || isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="max-w-full h-[15px]" />
              <Skeleton className="max-w-full h-[15px]" />
              <Skeleton className="max-w-full h-[15px]" />
            </div>
          ) : (
            filteredCategories &&
            filteredCategories
              .slice(0, showMore ? amountOfCategories : 5)
              .map((category: CategoryInterface) => (
                <Button
                  key={`${category._id}`}
                  variant="outline"
                  className="flex items-center whitespace-normal gap-2 font-normal cursor-pointer justify-center w-full h-full px-2"
                  onClick={(e) => handleAddCategory(category)}
                >
                  {category.name}
                </Button>
              ))
          )}
          {filteredCategories &&
            filteredCategories.length === 0 &&
            categorySearchQuery.trim() !== "" && (
              <p className="text-xs text-muted-foreground text-center py-1">
                {t("categoryNotFound")}
              </p>
            )}
          {availableCategories && availableCategories.length > 5 && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={showMoreCategories}
              >
                {t("seeMore")}
              </Button>
              {amountOfCategories > 5 && (
                <Button
                  variant="ghost"
                  className="w-full justify-center"
                  onClick={showLessCategories}
                >
                  {t("seeLess")}
                </Button>
              )}
            </>
          )}
        </div>
        <div className="mt-4 grid gap-2">
          <div className="grid grid-col gap-2 lg:items-center lg:gap-2 lg:grid lg:grid-cols-[1fr_auto]">
            <Input
              placeholder={t("searchCategories")}
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button
              type="button"
              onClick={(e) => handleAddCategoryFromSearch(e)}
            >
              {t("add")}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selectedCategories &&
              selectedCategories.length > 0 &&
              selectedCategories.map((category: CategoryInterface) => (
                <Button
                  key={`${category._id}`}
                  variant="default"
                  className="max-w-content justify-between items-center flex whitespace-normal px-2 py-6"
                  onClick={() => handleRemoveCategory(category)}
                >
                  <span className="flex-1 text-center ">{category.name}</span>
                  <XIcon classes="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Categories;
