import deepmerge                                                                                           from 'deepmerge';
import {Control, useController, UseControllerReturn}                                                       from 'react-hook-form';
import {FixedSizeList}                                                                                     from 'react-window';
import React, {MutableRefObject, Ref, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState} from 'react';

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

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

export type TailwindSelectClassNames = {
  container: {
    always: string;
  };
  control: {
    always: string;
  };
  input: {
    always: string;
    isNormal: string;
    isPreview: string;
    isPlaceholder: string;
  };
  menu: {
    maxHeight: number;
    always: string;
  };
  option: {
    height: number;
    indent: number,
    always: string;
    isNormal: string;
    isCandidate: string;
    isCurrentValue: string;
  };
  empty: {
    always: string;
  };
  heading: {
    always: string;
  };
};

export type TailwindSelectPartialClassNames = RecursivePartial<TailwindSelectClassNames>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const selectClassNames: TailwindSelectClassNames = {
  container: {
    always: ``,
  },
  control: {
    always: ``,
  },
  input: {
    always: ``,
    isNormal: ``,
    isPreview: ``,
    isPlaceholder: ``,
  },
  menu: {
    maxHeight: 300,
    always: ``,
  },
  option: {
    height: 40,
    indent: 10,
    always: ``,
    isNormal: ``,
    isCandidate: ``,
    isCurrentValue: ``,
  },
  empty: {
    always: ``,
  },
  heading: {
    always: ``,
  },
};

export type TailwindSelectBaseProps<T> = {
  inputRef?: Ref<HTMLInputElement>;
  innerRef?: Ref<TailwindSelectRef>;
  classNames: TailwindSelectPartialClassNames;
  options: Array<OptionSpec<T>>;
  placeholder?: React.ReactNode;

  onCandidateChange?: (value: T | undefined) => void;

  enableFlexWidth?: boolean;
  enableIntegratedMode?: boolean;
  enablePreview?: boolean;
  enableSearch?: boolean;

  autoFocus?: boolean;
  forceOpen?: boolean;

  onFocus?: () => void;
  onBlur?: () => void;
};

export type TailwindSelectFormProps<T> = TailwindSelectBaseProps<T> & {
  control: Control<any>;
  name: string;
  defaultValue: T;

  value?: undefined;
  onChange?: undefined;
};

export type TailwindSelectValueProps<T> = TailwindSelectBaseProps<T> & {
  control?: undefined;
  name?: undefined;
  defaultValue?: undefined;

  value: T | undefined;
  onChange?: (value: T | undefined) => void;
};

export type TailwindSelectProps<T> =
  | TailwindSelectFormProps<T>
  | TailwindSelectValueProps<T>;

export type TailwindSelectRef = {
  focus: () => void,
};

export function TailwindSelect<T>(props: TailwindSelectProps<T>) {
  const classNames = deepmerge(selectClassNames, props.classNames) as any as TailwindSelectClassNames;

  const {
    autoFocus = false,
    enableFlexWidth = false,
    enableIntegratedMode = false,
    enablePreview = true,
    enableSearch = true,
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
    setSearch(``);
    setCandidateValue(undefined);
    onChange?.(value);
  }, [onChange]);

  const applyValueAndBlur = useCallback((value: T) => {
    internalInputRef.current?.blur();
    applyValue(value);
  }, [applyValue]);

  const [search, setSearch] = useState(``);

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
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
      const optionSpecIndex = optionSpecs.length;
      optionSpecs.push(option);

      if (isOptionGroup(option)) {
        const index = children.length;

        let heading: React.ReactNode | undefined;
        if (typeof option.label !== `undefined`)
          heading = <Heading classNames={classNames} depth={depth} spec={option}/>;

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

        if (valueIndex === null && option.value === value)
          valueIndex = optionSpecIndex;
        if (candidateValueIndex === null && option.value === candidateValue) {
          candidateValueIndex = optionSpecIndex;
          candidateChildIndex = children.length;
        }

        children.push(<Item classNames={classNames} depth={depth} spec={option} isCandidate={candidateValue === option.value} isCurrentValue={value === option.value} onChange={applyValueAndBlur} onMouseEnter={applyCandidateValue} onMouseLeave={resetCandidateValue}/>);
      }
    }
  };

  traverseOptions(0, props.options);

  if (children.length === 0) {
    if (hasOptionData) {
      children.push(<Empty classNames={classNames} message={`No matching options`}/>);
    } else {
      children.push(<Empty classNames={classNames} message={`No options`}/>);
    }
  }

  const menuHeight = Math.min(
    classNames.menu.maxHeight,
    children.length * classNames.option.height,
  );

  const initialScrollOffset = valueIndex !== null
    ? Math.max(0, valueIndex * classNames.option.height - (classNames.menu.maxHeight - classNames.option.height) / 2)
    : 0;

  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const displayOpen = menuIsOpen || forceOpen;

  const referenceValueIndex = enablePreview
    ? candidateValueIndex ?? valueIndex
    : valueIndex;

  const isPreview = search === `` && enablePreview && candidateValueIndex !== null;
  const isValue = search === `` && !isPreview && referenceValueIndex !== null;
  const isPlaceholder = search === `` && !isPreview && referenceValueIndex === null;

  const finalPlaceholder = referenceValueIndex !== null
    ? optionSpecs[referenceValueIndex].label
    : props.placeholder;

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    setMenuIsOpen(true);

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

  const rightClickStatus = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const onFocus = useCallback(() => {
    if (rightClickStatus.current === null) {
      setMenuIsOpen(true);
    }
  }, []);

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

  const contentRenderer = useCallback(({data, index, style}) => (
    <div className={`pointer-events-auto`} style={{direction: `ltr`, ...style}}>{data[index]}</div>
  ), []);

  return <>
    <div className={`relative ${classNames.container.always} ${enableIntegratedMode && !displayOpen ? `pointer-events-none opacity-0` : ``}`}>
      <div className={classNames.control.always}>
        <div className={`relative`}>
          {(isValue || isPreview || isPlaceholder) && (
            <div className={`absolute inset-0 pointer-events-none select-none`}>
              <div className={`flex items-center ${resolveClassNames(classNames.input, {isPreview, isPlaceholder})}`}>
                {finalPlaceholder}
              </div>
            </div>
          )}
          <input ref={inputRef} autoFocus={autoFocus} readOnly={!enableSearch} className={resolveClassNames(classNames.input, {isNormal: true})} style={{width: `100%`}} value={search} onKeyDown={onKeyDown} onChange={onSearchChange} onMouseDown={onMouseDown} onFocus={onFocus} onBlur={onBlur} onClick={onFocus}/>
        </div>
      </div>
      {displayOpen && (
        <div className={`${enableIntegratedMode ? `` : `absolute`} left-0 ${enableFlexWidth ? `w-64` : `right-0`}`}>
          <div className={`overflow-auto ${classNames.menu.always}`} style={{lineHeight: `${classNames.option.height}px`}}>
            <FixedSizeList ref={virtualizedContainerRef} width={`100%`} height={menuHeight} itemData={children} itemCount={children.length} itemSize={classNames.option.height} initialScrollOffset={initialScrollOffset} style={{direction: `rtl`}}>
              {contentRenderer}
            </FixedSizeList>
          </div>
        </div>
      )}
    </div>
  </>;
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

function resolveClassNames<T extends {[T: string]: boolean}>(classNames: {always: string} & {[key in keyof T]: string}, state: T) {
  const effectiveClassNames: Array<string> = [];

  if (typeof classNames.always === `string`)
    effectiveClassNames.push(classNames.always);

  for (const key of Object.keys(state))
    if (state[key])
      effectiveClassNames.push(classNames[key]);

  return effectiveClassNames.join(` `);
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
  classNames: TailwindSelectClassNames;
  depth: number;
  spec: OptionGroup<T>;
};

function Heading<T>({classNames, depth, spec}: HeadingProps<T>) {
  return (
    <div style={{paddingLeft: depth * classNames.option.indent}}>
      <div className={resolveClassNames(classNames.heading, {})}>
        {spec.label}
      </div>
    </div>
  );
}

type ItemProps<T> = {
  classNames: TailwindSelectClassNames;
  depth: number;
  spec: OptionData<T>;

  isCandidate: boolean;
  isCurrentValue: boolean;

  onChange?: (value: T) => void;

  onMouseEnter?: (value: T) => void;
  onMouseLeave?: () => void;
};

function Item<T>({classNames, depth, spec, isCandidate, isCurrentValue, onChange, onMouseEnter: onMouseEnterUser, onMouseLeave: onMouseLeaveUser}: ItemProps<T>) {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onChange?.(spec.value);
  }, [onChange, spec.value]);

  const onMouseEnter = useCallback(() => {
    onMouseEnterUser?.(spec.value);
  }, [onMouseEnterUser, spec.value]);

  const onMouseLeave = useCallback(() => {
    onMouseLeaveUser?.();
  }, [onMouseEnterUser]);

  return (
    <div className={`cursor-pointer`} onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className={resolveClassNames(classNames.option, {isNormal: !isCandidate && !isCurrentValue, isCandidate, isCurrentValue})}>
        <div style={{paddingLeft: depth * classNames.option.indent}}>
          {spec.label}
        </div>
      </div>
    </div>
  );
}

type EmptyProps = {
  classNames: TailwindSelectClassNames;
  message: string;
};

function Empty({classNames, message}: EmptyProps) {
  return (
    <div className={resolveClassNames(classNames.empty, {})}>
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
