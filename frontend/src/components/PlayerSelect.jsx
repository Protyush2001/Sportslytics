import React from "react";
import Select from "react-select";

const PlayerSelect = ({ label, players, onChange, isMulti = false, value }) => {
  const options = players.map((player) => ({
    label: player.name,
    value: player._id,
  }));

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Select
        options={options}
        isMulti={isMulti}
        onChange={(selected) =>
          isMulti
            ? onChange(selected.map((s) => s.value))
            : onChange(selected?.value || "")
        }
        value={
          isMulti
            ? options.filter((opt) => value.includes(opt.value))
            : options.find((opt) => opt.value === value)
        }
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );
};

export default PlayerSelect;