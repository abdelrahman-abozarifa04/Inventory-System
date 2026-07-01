import { useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import { useTranslation } from "react-i18next";
import useCategories from "../../hooks/useCategories";

/**
 * CategorySelect
 * - Searchable dropdown (react-select)
 * - Creatable option: "Create New Category: <name>"
 * - Persists new categories to Firestore and updates options immediately (via onSnapshot)
 *
 * Value contract:
 *  value = { category_id, category_name_en, category_name_ar } | null
 */
const CategorySelect = ({ value, onChange, disabled }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const { categories, loading, creating, createCategory } = useCategories();

  const options = useMemo(() => {
    return (categories || []).map((c) => ({
      value: c.id,
      label: isRTL ? (c.name_ar || c.name_en) : (c.name_en || c.name_ar),
      data: c,
    }));
  }, [categories, isRTL]);

  const selectedOption = useMemo(() => {
    if (!value?.category_id) return null;
    const fromList = options.find((o) => o.value === value.category_id);
    if (fromList) return fromList;

    // Fallback (e.g. category deleted but product still has snapshot)
    const label = isRTL
      ? (value.category_name_ar || value.category_name_en)
      : (value.category_name_en || value.category_name_ar);

    return {
      value: value.category_id,
      label: label || "",
      data: {
        id: value.category_id,
        name_en: value.category_name_en || "",
        name_ar: value.category_name_ar || "",
      },
    };
  }, [value, options, isRTL]);

  // react-select inline styles using existing theme tokens (CSS variables).
  const styles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: "var(--color-surface)",
        borderColor: state.isFocused
          ? "var(--color-primary)"
          : "color-mix(in srgb, var(--color-text-muted) 25%, transparent)",
        boxShadow: state.isFocused ? "0 0 0 3px var(--color-highlight-dim)" : "none",
        direction: isRTL ? "rtl" : "ltr",
        textAlign: isRTL ? "right" : "left",
        paddingInlineStart: 2,
        paddingInlineEnd: 2,
        opacity: disabled ? 0.6 : 1,
      }),
      valueContainer: (base) => ({
        ...base,
        paddingInlineStart: 12,
        paddingInlineEnd: 12,
      }),
      placeholder: (base) => ({
        ...base,
        color: "var(--color-text-muted)",
      }),
      singleValue: (base) => ({
        ...base,
        color: "var(--color-text)",
      }),
      input: (base) => ({
        ...base,
        color: "var(--color-text)",
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: "var(--color-surface)",
        borderRadius: 12,
        overflow: "hidden",
        direction: isRTL ? "rtl" : "ltr",
        border: "1px solid var(--color-border)",
        boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? "var(--color-primary)"
          : state.isFocused
            ? "color-mix(in srgb, var(--color-primary) 8%, transparent)"
            : "transparent",
        color: state.isSelected ? "var(--color-text-inverse)" : "var(--color-text)",
        cursor: "pointer",
        textAlign: isRTL ? "right" : "left",
      }),
      indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: "var(--color-border)",
      }),
      dropdownIndicator: (base) => ({
        ...base,
        color: "var(--color-text-muted)",
      }),
      clearIndicator: (base) => ({
        ...base,
        color: "var(--color-text-muted)",
      }),
    }),
    [isRTL, disabled]
  );

  const handleSelectChange = (opt) => {
    if (!opt) {
      onChange?.(null);
      return;
    }
    const c = opt.data;
    onChange?.({
      category_id: c.id,
      category_name_en: c.name_en || "",
      category_name_ar: c.name_ar || "",
    });
  };

  const handleCreate = async (inputValue) => {
    const raw = String(inputValue || "").trim();
    if (!raw) return;

    // Bilingual support:
    // - Detect if the typed text is Arabic-script; store it into the matching field.
    // - The hook will mirror the provided value to the other language field to keep both populated.
    const hasArabicChars = /[\u0600-\u06FF]/.test(raw);
    const created = await createCategory({
      name_en: hasArabicChars ? "" : raw,
      name_ar: hasArabicChars ? raw : "",
    });

    onChange?.({
      category_id: created.id,
      category_name_en: created.name_en || "",
      category_name_ar: created.name_ar || "",
    });
  };

  return (
    <CreatableSelect
      isClearable
      isDisabled={disabled || loading || creating}
      isLoading={loading || creating}
      options={options}
      value={selectedOption}
      onChange={handleSelectChange}
      onCreateOption={handleCreate}
      placeholder={
        loading
          ? (t("inventory.modals.category_loading") || t("common.loading"))
          : (t("inventory.modals.category_placeholder") || "Search or create a category...")
      }
      formatCreateLabel={(inputValue) =>
        t("inventory.modals.category_create", {
          name: inputValue,
          defaultValue: `Create New Category: ${inputValue}`,
        })
      }
      noOptionsMessage={() => t("inventory.modals.category_no_options", "No categories")}
      styles={styles}
      classNamePrefix="rs"
    />
  );
};

export default CategorySelect;
