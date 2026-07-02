import { useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import { useTranslation } from "react-i18next";
import useTradeNames from "../../hooks/useTradeNames";

/**
 * TradeNameSelect
 * - Searchable dropdown (react-select)
 * - Creatable option: "Create New Trade Name: <name>"
 * - Persists to Firestore and updates immediately (via onSnapshot)
 *
 * Value contract:
 *  value = { trade_name_id, trade_name_en, trade_name_ar } | null
 */
const TradeNameSelect = ({ value, onChange, disabled }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const { tradeNames, loading, creating, createTradeName } = useTradeNames();

  const options = useMemo(() => {
    return (tradeNames || []).map((n) => ({
      value: n.id,
      label: isRTL ? (n.name_ar || n.name_en) : (n.name_en || n.name_ar),
      data: n,
    }));
  }, [tradeNames, isRTL]);

  const selectedOption = useMemo(() => {
    if (!value?.trade_name_id) return null;
    const fromList = options.find((o) => o.value === value.trade_name_id);
    if (fromList) return fromList;

    const label = isRTL
      ? (value.trade_name_ar || value.trade_name_en)
      : (value.trade_name_en || value.trade_name_ar);

    return {
      value: value.trade_name_id,
      label: label || "",
      data: {
        id: value.trade_name_id,
        name_en: value.trade_name_en || "",
        name_ar: value.trade_name_ar || "",
      },
    };
  }, [value, options, isRTL]);

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
      menuPortal: (base) => ({
        ...base,
        zIndex: 62,
      }),
    }),
    [isRTL, disabled]
  );

  const handleSelectChange = (opt) => {
    if (!opt) {
      onChange?.(null);
      return;
    }

    const n = opt.data;
    onChange?.({
      trade_name_id: n.id,
      trade_name_en: n.name_en || "",
      trade_name_ar: n.name_ar || "",
    });
  };

  const handleCreate = async (inputValue) => {
    const raw = String(inputValue || "").trim();
    if (!raw) return;

    const hasArabicChars = /[\u0600-\u06FF]/.test(raw);
    const created = await createTradeName({
      name_en: hasArabicChars ? "" : raw,
      name_ar: hasArabicChars ? raw : "",
    });

    onChange?.({
      trade_name_id: created.id,
      trade_name_en: created.name_en || "",
      trade_name_ar: created.name_ar || "",
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
          ? (t("inventory.modals.trade_name_loading") || t("common.loading"))
          : (t("inventory.modals.trade_name_placeholder") || "Search or create a trade name...")
      }
      formatCreateLabel={(inputValue) =>
        t("inventory.modals.trade_name_create", {
          name: inputValue,
          defaultValue: `Create New Trade Name: ${inputValue}`,
        })
      }
      noOptionsMessage={() => t("inventory.modals.trade_name_no_options", "No trade names")}
      styles={styles}
      classNamePrefix="rs"
      menuPortalTarget={document.body}
      menuPosition="fixed"
    />
  );
};

export default TradeNameSelect;
