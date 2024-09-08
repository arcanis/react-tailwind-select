import clsx                                                                                                           from 'clsx';
import {Control, useController, UseControllerReturn}                                                                  from 'react-hook-form';
import {FixedSizeList, ListOnScrollProps}                                                                             from 'react-window';
import React, {MutableRefObject, Ref, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState} from 'react';

declare module "react" {
  interface CSSProperties {
    "--cmdk-indent-level"?: number;
    "--cmdk-option-height"?: string;
  }
}

export type OptionData<T> = {
  label: React.ReactNode;
  options?: undefined;
  search?: string;
  value: T;
};

export type OptionGroup<T> = {
  label?: React.ReactNode;
  keyed?: Record<string, OptionSpec<T>>;
  options?: Array<OptionSpec<T>>;
  value?: undefined;
};

export type OptionSpec<T> =
  | OptionGroup<T>
  | OptionData<T>;

export type SelectBaseProps<T> = {
  className?: string;

  inputRef?: Ref<HTMLInputElement>;
  innerRef?: Ref<SelectRef>;
  options: Array<OptionSpec<T>>;
  totalOptionCount?: number;
  header?: React.ReactNode;
  placeholder?: React.ReactNode;

  fetchNextPage?: (() => void) | false | null;

  onSearchChange?: (search: string) => void;
  onCandidateChange?: (value: T | undefined) => void;

  maxMenuHeight?: number;
  optionHeight?: number;

  enableFlexWidth?: boolean;
  enableIntegratedMode?: boolean;
  enableOverlayMode?: boolean;
  enablePreview?: boolean;
  enableSearch?: boolean;
  enableTextMode?: boolean;

  autoFocus?: boolean;
  forceOpen?: boolean;

  onFocus?: () => void;
  onBlur?: () => void;
};

export type SelectFormProps<T> = SelectBaseProps<T> & {
  control: Control<any>;
  name: string;
  defaultValue: T;

  value?: undefined;
  onChange?: undefined;
};

export type SelectValueProps<T> = SelectBaseProps<T> & {
  control?: undefined;
  name?: undefined;
  defaultValue?: undefined;

  value: T | undefined;
  onChange?: (value: T | undefined) => void;
};

export type SelectProps<T> =
  | SelectFormProps<T>
  | SelectValueProps<T>;

export type SelectRef = {
  focus: () => void;
};

export function Select<T>(props: SelectProps<T>) {
  const {
    fetchNextPage = null,

    maxMenuHeight = 400,
    optionHeight = 40,

    autoFocus = false,
    enableFlexWidth = false,
    enableIntegratedMode = false,
    enableOverlayMode = false,
    enablePreview = true,
    enableSearch = true,
    enableTextMode = false,
    forceOpen = false,
  } = props;

  let controller: UseControllerReturn<any, string> | undefined;
  if (typeof props.control !== `undefined`) {
    controller = useController({
      name: props.name ?? ``,
      control: props.control ?? undefined,
      defaultValue: props.defaultValue,
    });
  }

  const value = typeof controller !== `undefined`
    ? controller.field.value
    : props.value;

  const onChange = typeof controller !== `undefined`
    ? controller.field.onChange
    : props.onChange;

  const [candidateValue, setCandidateValue] = useState<T | undefined>();
  const scrollIntoViewNextRenderRef = useRef<boolean>(false);

  const savedSelectionRef = useRef<Range | null>(null);

  const [lastKnownSearch, setLastKnownSearch] = useState(``);
  const [search, setSearch] = useState(``);

  useImperativeHandle(props.innerRef, () => ({
    focus: () => {
      savedSelectionRef.current = saveSelection();

      internalInputRef.current?.scrollIntoView({behavior: `auto`, block: `center`, inline: `center`});
      internalInputRef.current?.focus();
    },
  }));

  const resetCandidateValue = useCallback(() => {
    setCandidateValue(undefined);
    props.onCandidateChange?.(undefined);
  }, [props.onCandidateChange]);

  const applyCandidateValue = useCallback((value: T) => {
    setCandidateValue(value);
    props.onCandidateChange?.(value);
  }, [props.onCandidateChange]);

  const applyCandidateValueWithScroll = useCallback((value: T) => {
    applyCandidateValue(value);
    scrollIntoViewNextRenderRef.current = true;
  }, [applyCandidateValue]);

  const applyValue = useCallback((value: T | undefined) => {
    setMenuIsOpen(false);
    setLastKnownSearch(search);
    setSearch(``);
    setCandidateValue(undefined);
    onChange?.(value);
  }, [onChange, search]);

  const applyValueAndBlur = useCallback((value: T) => {
    internalInputRef.current?.blur();
    applyValue(value);
  }, [applyValue]);

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    props.onSearchChange?.(e.target.value);
  }, []);

  const children: Array<React.ReactNode> = [];
  const optionSpecs: Array<OptionSpec<T>> = [];

  let valueIndex: number | null = null;
  let candidateValueIndex: number | null = null;

  // Same as `candidateValueIndex`, but only counts nodes with children
  let candidateChildIndex: number | null = null;

  let hasOptionData = false;

  const traverseOptions = (depth: number, options: Array<OptionSpec<T>>) => {
    for (const option of options) {
      if (isOptionGroup(option)) {
        optionSpecs.push(option);

        const index = children.length;

        let heading: React.ReactNode | undefined;
        if (typeof option.label !== `undefined`)
          heading = <Heading depth={depth} spec={option}/>;

        const nextDepth = heading
          ? depth + 1
          : depth;

        if (typeof option.keyed !== `undefined`) {
          const keys = Object.keys(option.keyed);
          keys.sort((a, b) => a < b ? -1 : a > b ? +1 : 0);
          traverseOptions(nextDepth, keys.map(key => option.keyed![key]));
        }

        if (typeof option.options !== `undefined`)
          traverseOptions(nextDepth, option.options);

        if (heading && children.length > index) {
          children.splice(index, 0, heading);
        }
      } else {
        hasOptionData = true;

        const reference = option.search;
        if (search !== `` && typeof reference !== `undefined` && !reference.toLowerCase().includes(search.toLowerCase()))
          continue;

        const optionSpecIndex = optionSpecs.length;
        optionSpecs.push(option);

        const isCandidateValue = getValueId(option.value) === getValueId(candidateValue);
        const isCurrentValue = getValueId(option.value) === getValueId(value);

        if (valueIndex === null && isCurrentValue)
          valueIndex = optionSpecIndex;

        if (candidateValueIndex === null && isCandidateValue) {
          candidateValueIndex = optionSpecIndex;
          candidateChildIndex = children.length;
        }

        children.push(<Item depth={depth} spec={option} isCandidateValue={isCandidateValue} isCurrentValue={isCurrentValue} onChange={applyValueAndBlur} onMouseEnter={applyCandidateValue} onMouseLeave={resetCandidateValue}/>);
      }
    }
  };

  traverseOptions(0, props.options);

  if (children.length === 0) {
    if (hasOptionData) {
      children.push(<Empty message={`No matching options`}/>);
    } else {
      children.push(<Empty message={`No options`}/>);
    }
  }

  const menuHeight = Math.min(
    maxMenuHeight,
    children.length * optionHeight,
  );

  const initialScrollOffset = valueIndex !== null
    ? Math.max(0, valueIndex * optionHeight - (maxMenuHeight - optionHeight) / 2)
    : 0;

  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const displayOpen = menuIsOpen || forceOpen;

  const referenceValueIndex = enablePreview
    ? candidateValueIndex ?? valueIndex
    : valueIndex;

  let controlMode: string = `search`;
  if (search === ``) {
    if (enablePreview && candidateValueIndex !== null) {
      controlMode = `preview`;
    } else if (referenceValueIndex !== null) {
      controlMode = `value`;
    } else {
      controlMode = `placeholder`;
    }
  }

  const finalPlaceholder = referenceValueIndex !== null
    ? optionSpecs[referenceValueIndex].label
    : props.placeholder;

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!menuIsOpen)
      return;

    switch (e.key) {
      case `Backspace`: {
        if (search === ``) {
          e.preventDefault();

          if (typeof candidateValue !== `undefined`) {
            setCandidateValue(undefined);
          } else {
            applyValue(undefined);
          }
        }
      } break;

      case `PageUp`:
      case `Home`: {
        if (menuIsOpen) {
          e.preventDefault();

          applyCandidateValueWithScroll(getAdjustedCandidateValue(optionSpecs, 0, 0, 1));
        }
      } break;

      case `PageDown`:
      case `End`: {
        if (menuIsOpen) {
          e.preventDefault();

          applyCandidateValueWithScroll(getAdjustedCandidateValue(optionSpecs, optionSpecs.length - 1, 0, -1));
        }
      } break;

      case `Escape`: {
        e.preventDefault();
        e.stopPropagation();

        setMenuIsOpen(false);
        setSearch(``);

        if (savedSelectionRef.current) {
          const range = savedSelectionRef.current;
          savedSelectionRef.current = null;
          restoreSelection(range);
        }
      } break;

      case `ArrowUp`: {
        if (menuIsOpen) {
          e.preventDefault();

          applyCandidateValueWithScroll(getPrevCandidateValue(optionSpecs, candidateValueIndex ?? valueIndex));
        }
      } break;

      case `ArrowDown`: {
        e.preventDefault();

        if (menuIsOpen) {
          applyCandidateValueWithScroll(getNextCandidateValue(optionSpecs, candidateValueIndex ?? valueIndex));
        } else {
          setMenuIsOpen(true);
        }
      } break;

      case `Enter`: {
        e.preventDefault();

        if (typeof candidateValue !== `undefined`)
          applyValue(candidateValue);

        if (savedSelectionRef.current) {
          const range = savedSelectionRef.current;
          savedSelectionRef.current = null;
          restoreSelection(range);
        }
      }
    }
  }, [optionSpecs, menuIsOpen, candidateValueIndex]);

  useEffect(() => {
    window.addEventListener(`keydown`, onKeyDown);
    return () => {
      window.removeEventListener(`keydown`, onKeyDown);
    };
  }, [onKeyDown]);

  const rightClickStatus = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    setMenuIsOpen(true);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setMenuIsOpen(true);
    } else if (e.button === 2) {
      if (rightClickStatus.current !== null)
        clearTimeout(rightClickStatus.current);

      rightClickStatus.current = setTimeout(() => {
        rightClickStatus.current = null;
      }, 16);
    }
  }, []);

  const onFocus = useCallback((e: React.FocusEvent | React.MouseEvent) => {
    if (e.type === `focus`) {
      setSearch(lastKnownSearch);
      applyCandidateValueWithScroll(value);
    }

    if (rightClickStatus.current === null) {
      setMenuIsOpen(true);
    }
  }, [lastKnownSearch, value]);

  const onBlur = useCallback(() => {
    controller?.field.onBlur();
    setSearch(``);
    setCandidateValue(undefined);
    setMenuIsOpen(false);
  }, [controller?.field.onBlur]);

  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const virtualizedContainerRef = useRef<FixedSizeList | null>(null);

  const inputRef = useMergedRef(internalInputRef, props.inputRef, controller?.field.ref);

  useLayoutEffect(() => {
    if (!scrollIntoViewNextRenderRef.current)
      return;

    if (candidateChildIndex !== null)
      virtualizedContainerRef.current?.scrollToItem(candidateChildIndex);

    scrollIntoViewNextRenderRef.current = false;
  });

  const contentRenderer = useCallback(({data, index, style}: {data: any, index: number, style: React.CSSProperties}) => (
    <div className={`pointer-events-auto`} style={{direction: `ltr`, ...style}}>
      {data[index]}
    </div>
  ), []);

  const totalMenuSize = children.length * optionHeight;
  const maxScroll = Math.max(0, totalMenuSize - menuHeight);

  const handleScroll = useCallback((e: ListOnScrollProps) => {
    if (fetchNextPage && e.scrollOffset >= maxScroll - 100) {
      fetchNextPage?.();
    }
  }, [maxScroll, fetchNextPage]);

  return <>
    <div className={clsx(props.className, {
      [`cmdk-flex-width-enabled`]: enableFlexWidth,
      [`cmdk-overlay-mode-enabled`]: enableOverlayMode,
      [`cmdk-text-mode-enabled`]: enableTextMode,
      [`cmdk-integrated-mode-enabled`]: enableIntegratedMode,

      [`cmdk-is-${controlMode}`]: true,
      [`cmdk-is-expanded`]: menuIsOpen,
    })} style={{
      [`--cmdk-option-height`]: `${optionHeight}px`,
    }}>
      <div className={`cmdk-root`}>
        <div className={`cmdk-container`}>
          {props.header}
          <div className={`cmdk-control`}>
            <label className={`cmdk--control-inner`}>
              <div className={`cmdk--placeholder-wrapper`} onClick={onFocus}>
                <div className={`cmdk-placeholder`}>
                  <div className={`cmdk--placeholder-inner`}>
                    {finalPlaceholder}
                  </div>
                </div>
              </div>
              {enableTextMode && (
                <input ref={inputRef} type={`text`} className={`cmdk-input`} autoFocus={autoFocus} readOnly={!enableSearch} value={search} onKeyDown={onSearchKeyDown} onChange={onSearchChange} onMouseDown={onMouseDown} onFocus={onFocus} onBlur={onBlur} onClick={onFocus}/>
              )}
            </label>
          </div>
          {displayOpen && (
            <div className={`cmdk--menu-wrapper`}>
              <div className={`cmdk-menu`}>
                <FixedSizeList ref={virtualizedContainerRef} width={`100%`} height={menuHeight} itemData={children} itemCount={children.length} itemSize={optionHeight} initialScrollOffset={initialScrollOffset} onScroll={handleScroll} style={{willChange: ``}}>
                  {contentRenderer}
                </FixedSizeList>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </>;
}

function getValueId(val: unknown) {
  return typeof val === `object` && val !== null && typeof (val as any).id === `string` ? (val as any).id : val;
}

function saveSelection() {
  const sel = window.getSelection();
  if (sel !== null && sel.rangeCount > 0) {
    return sel.getRangeAt(0).cloneRange();
  } else {
    return null;
  }
}

function restoreSelection(range: Range) {
  if (range === null)
    return;

  const sel = window.getSelection();
  if (sel === null)
    return;

  sel.removeAllRanges();
  sel.addRange(range);
}

function isOptionGroup<T>(option: OptionSpec<T>): option is OptionGroup<T> {
  return typeof option.value === `undefined`;
}

function getAdjustedCandidateValue<T>(optionSpecs: Array<OptionSpec<T>>, index: number, initialInc: number, inc: number) {
  let next: OptionSpec<T>;

  index += initialInc;
  next = optionSpecs[(index + optionSpecs.length) % optionSpecs.length];

  while (isOptionGroup(next)) {
    index += inc;
    next = optionSpecs[(index + optionSpecs.length) % optionSpecs.length];
  }

  return next.value;
}

function getPrevCandidateValue<T>(optionSpecs: Array<OptionSpec<T>>, index: number | null) {
  if (index === null) {
    return getAdjustedCandidateValue(optionSpecs, optionSpecs.length - 1, 0, -1);
  } else {
    return getAdjustedCandidateValue(optionSpecs, index, -1, -1);
  }
}

function getNextCandidateValue<T>(optionSpecs: Array<OptionSpec<T>>, index: number | null) {
  if (index === null) {
    return getAdjustedCandidateValue(optionSpecs, 0, 0, 1);
  } else {
    return getAdjustedCandidateValue(optionSpecs, index, 1, 1);
  }
}

type HeadingProps<T> = {
  depth: number;
  spec: OptionGroup<T>;
};

function Heading<T>({depth, spec}: HeadingProps<T>) {
  return (
    <div className={`cmdk-heading`} style={{[`--cmdk-indent-level`]: depth}}>
      {spec.label}
    </div>
  );
}

type ItemProps<T> = {
  depth: number;
  spec: OptionData<T>;

  isCandidateValue?: boolean;
  isCurrentValue?: boolean;

  onChange?: (value: T) => void;

  onMouseEnter?: (value: T) => void;
  onMouseLeave?: () => void;
};

function Item<T>({depth, spec, isCandidateValue, isCurrentValue, onChange, onMouseEnter: onMouseEnterUser, onMouseLeave: onMouseLeaveUser}: ItemProps<T>) {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      e.preventDefault();
      onChange?.(spec.value);
    }
  }, [onChange, spec.value]);

  const onMouseEnter = useCallback(() => {
    onMouseEnterUser?.(spec.value);
  }, [onMouseEnterUser, spec.value]);

  const onMouseLeave = useCallback(() => {
    onMouseLeaveUser?.();
  }, [onMouseEnterUser]);

  return (
    <div className={clsx(`cmdk-option`, {
      [`cmdk-is-candidate-value`]: isCandidateValue,
      [`cmdk-is-current-value`]: isCurrentValue,
    })} style={{[`--cmdk-indent-level`]: depth}} onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {spec.label}
    </div>
  );
}

type EmptyProps = {
  message: string;
};

function Empty({message}: EmptyProps) {
  return (
    <div className={`cmdk-empty`}>
      {message}
    </div>
  );
}

function useMergedRef<T>(...refs: Array<Ref<T> | undefined>) {
  const filteredRefs = refs.filter(ref => ref);
  if (!filteredRefs.length)
    return null;

  if (filteredRefs.length === 0)
    return filteredRefs[0];

  return useCallback((inst: T) => {
    for (const ref of filteredRefs) {
      if (typeof ref === `function`) {
        ref(inst);
      } else if (ref) {
        (ref as MutableRefObject<T>).current = inst;
      }
    }
  }, refs);
}
