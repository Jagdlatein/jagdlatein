import { Children, Fragment, isValidElement } from "react";
import styles from "../styles/MenuChoice.module.css";

function optionGroups(children, inherited = false, label = "") {
  const groups = [];
  let plain = [];
  const flush = () => { if (plain.length) { groups.push({ label, options: plain }); plain = []; } };
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type === Fragment) {
      flush(); groups.push(...optionGroups(child.props.children, inherited, label));
    } else if (child.type === "optgroup") {
      flush(); groups.push(...optionGroups(child.props.children, inherited || child.props.disabled, child.props.label));
    } else if (child.type === "option") {
      const value = String(child.props.value ?? child.props.children ?? "");
      // A disabled empty placeholder is an instruction, not a second action.
      if (value === "" && child.props.disabled) continue;
      plain.push({ value, label: child.props.children, disabled: inherited || child.props.disabled });
    }
  }
  flush();
  return groups;
}

// Presentation only: the existing owner validates the action, commits its URL
// or local filter, and decides when to close the menu and move focus.
export default function MenuChoice({ label, id, value, disabled = false, onChange, children, className = "", ...aria }) {
  const groups = optionGroups(children);
  const controls = aria["aria-controls"];
  const validValue = typeof value === "string" || typeof value === "number";
  return <fieldset id={id} tabIndex={-1} disabled={disabled} className={`${styles.choice} ${className}`} aria-label={aria["aria-label"] || undefined} aria-labelledby={aria["aria-labelledby"]} aria-describedby={aria["aria-describedby"]}>
    {label && <legend>{label}</legend>}
    {groups.map((group, index) => <div key={`${group.label}:${index}`} className={styles.group}>
      {group.label && <h3>{group.label}</h3>}
      <ul>{group.options.map(option => <li key={option.value}>
        <button type="button" data-menu-choice={option.value} aria-pressed={validValue && String(value) === option.value} aria-controls={controls} disabled={disabled || option.disabled} onClick={() => {
          if (disabled || option.disabled) return;
          const target = { value: option.value };
          onChange?.({ target, currentTarget: target });
        }}>{option.label}</button>
      </li>)}</ul>
    </div>)}
  </fieldset>;
}
