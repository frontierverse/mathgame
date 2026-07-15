"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import type * as THREE from "three";

import {
  buttonRepeatDelay,
  curriculum,
  deleteRepeatInterval,
  formatBigIntText,
  getArithmeticRelation,
  getExpressionDisplayTokens,
  getExpressionPreview,
  getKeyboardExpressionToken,
  getSubtractionDivisionRelation,
  getVisibleUnitSticks,
  inputRepeatInterval,
  isEditableTarget,
  primeCompositeQuizzes,
  type ArithmeticRelation,
  type ArithmeticTopic,
  type CurriculumGrade,
  type CurriculumSemester,
  type CurriculumUnit,
  type StandaloneSection,
  type SubtractionRelation,
} from "./mathLogic";
import { Backdrop } from "./three/Backdrop";
import { Button3D } from "./three/Button3D";
import { ChoiceGrid3D, type ChoiceGridItem } from "./three/ChoiceGrid3D";
import { ExpressionTray3D } from "./three/ExpressionTray3D";
import { HeaderBar3D } from "./three/HeaderBar3D";
import { NumberPad3D } from "./three/NumberPad3D";
import { Panel3D } from "./three/Panel3D";
import { FONT_BOLD, FONT_REGULAR, layout, palette } from "./three/theme";
import { useFitCamera } from "./three/useFitCamera";

type DivisorOutcome = "found" | "not";

const gradeColors = [palette.red, palette.green, palette.blue];
const gradeTextColors = ["#ffffff", "#ffffff", "#ffffff"];

const topicCards: ChoiceGridItem[] = [
  {
    key: "addition-multiplication",
    badgeLabel: "+×",
    badgeColor: palette.orange,
    badgeTextColor: palette.ink,
    title: "덧셈과 곱셈",
    subtitle: "같은 수가 반복되는 덧셈을 묶음으로 바라봅니다.",
    onClick: () => undefined,
  },
  {
    key: "subtraction-division",
    badgeLabel: "−÷",
    badgeColor: palette.blue,
    title: "뺄셈과 나눗셈",
    subtitle: "같은 수를 여러 번 빼며 나눗셈의 몫과 나머지를 봅니다.",
    onClick: () => undefined,
  },
];

const divisorFeedback: Record<number, { outcome: DivisorOutcome; text: string }> = {
  1: { outcome: "found", text: "1 ÷ 1 = 1. 1은 1을 약수로 가져요." },
  2: { outcome: "not", text: "1을 2로 나누면 반 조각이 됩니다. 2는 1의 약수가 아니에요." },
  3: { outcome: "not", text: "1을 3으로 나누면 세 조각 중 하나가 됩니다. 3도 1의 약수가 아니에요." },
};

function clearWindowTimer(timerId: number | null) {
  if (timerId !== null) {
    window.clearTimeout(timerId);
    window.clearInterval(timerId);
  }
}

function getSelectedSemester(grade: CurriculumGrade | null, semesterId: CurriculumSemester["id"] | null) {
  return grade?.semesters.find((semester) => semester.id === semesterId) ?? null;
}

function getSelectedUnit(semester: CurriculumSemester | null, unitId: string | null) {
  return semester?.units.find((unit) => unit.id === unitId) ?? null;
}

function getTitle({
  selectedStandaloneSection,
  selectedArithmeticTopic,
  selectedGrade,
  selectedSemester,
  selectedUnit,
  selectedSubunit,
}: {
  selectedStandaloneSection: StandaloneSection | null;
  selectedArithmeticTopic: ArithmeticTopic | null;
  selectedGrade: CurriculumGrade | null;
  selectedSemester: CurriculumSemester | null;
  selectedUnit: CurriculumUnit | null;
  selectedSubunit: string | null;
}) {
  if (selectedSubunit) {
    return selectedSubunit;
  }

  if (selectedUnit) {
    return selectedUnit.title;
  }

  if (selectedSemester) {
    return `${selectedGrade?.label ?? ""} ${selectedSemester.label}`;
  }

  if (selectedGrade) {
    return selectedGrade.label;
  }

  if (selectedArithmeticTopic === "addition-multiplication") {
    return "덧셈과 곱셈";
  }

  if (selectedArithmeticTopic === "subtraction-division") {
    return "뺄셈과 나눗셈";
  }

  if (selectedStandaloneSection === "arithmetic") {
    return "사칙연산";
  }

  return "수학 게임 연구소";
}

function getBreadcrumb({
  selectedStandaloneSection,
  selectedArithmeticTopic,
  selectedGrade,
  selectedSemester,
  selectedUnit,
  selectedSubunit,
}: {
  selectedStandaloneSection: StandaloneSection | null;
  selectedArithmeticTopic: ArithmeticTopic | null;
  selectedGrade: CurriculumGrade | null;
  selectedSemester: CurriculumSemester | null;
  selectedUnit: CurriculumUnit | null;
  selectedSubunit: string | null;
}) {
  const parts: string[] = [];

  if (selectedStandaloneSection === "arithmetic") {
    parts.push("사칙연산");
  }

  if (selectedArithmeticTopic === "addition-multiplication") {
    parts.push("덧셈과 곱셈");
  }

  if (selectedArithmeticTopic === "subtraction-division") {
    parts.push("뺄셈과 나눗셈");
  }

  if (selectedGrade) {
    parts.push(selectedGrade.label);
  }

  if (selectedSemester) {
    parts.push(selectedSemester.label);
  }

  if (selectedUnit) {
    parts.push(selectedUnit.title);
  }

  if (selectedSubunit) {
    parts.push(selectedSubunit);
  }

  return parts.join(" / ");
}

function BoardSurfaces() {
  const stageWidth = layout.stageRight - layout.stageLeft;
  const stageCenterX = (layout.stageLeft + layout.stageRight) / 2;
  const sidebarWidth = layout.sidebarRight - layout.sidebarLeft;
  const sidebarCenterX = (layout.sidebarLeft + layout.sidebarRight) / 2;
  const height = layout.top - layout.bottom;

  return (
    <group>
      <Panel3D
        width={stageWidth}
        height={height}
        radius={0.45}
        color={palette.panelBg}
        shadowColor={palette.stageBgShadow}
        shadowOffset={0.2}
        position={[stageCenterX, 0, -0.25]}
      />
      <Panel3D
        width={sidebarWidth}
        height={height}
        radius={0.45}
        color={palette.panelBgAlt}
        shadowColor={palette.stageBgShadow}
        shadowOffset={0.2}
        position={[sidebarCenterX, 0, -0.2]}
      />
    </group>
  );
}

function SceneCamera() {
  useFitCamera(layout.virtualWidth, layout.virtualHeight);

  useFrame(({ camera, pointer }, delta) => {
    const nextX = pointer.x * 0.28;
    const nextY = pointer.y * 0.12;
    const speed = Math.min(1, delta * 3);

    camera.position.x += (nextX - camera.position.x) * speed;
    camera.position.y += (nextY - camera.position.y) * speed;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function SceneDebugStats() {
  const { camera, gl, scene } = useThree();

  useFrame(() => {
    (
      window as Window & {
        __mathGameSceneStats?: {
          camera: { x: number; y: number; z: number };
          children: number;
          meshes: number;
          visibleMeshes: number;
          renderCalls: number;
        };
      }
    ).__mathGameSceneStats = {
      camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      children: scene.children.length,
      meshes: scene.children.reduce((count, child) => {
        let total = count;

        child.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            total += 1;
          }
        });

        return total;
      }, 0),
      visibleMeshes: scene.children.reduce((count, child) => {
        let total = count;

        child.traverse((object) => {
          if ((object as THREE.Mesh).isMesh && object.visible) {
            total += 1;
          }
        });

        return total;
      }, 0),
      renderCalls: gl.info.render.calls,
    };
  });

  return null;
}

function TextPanel3D({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const color = tone === "good" ? palette.greenText : tone === "warn" ? palette.redText : palette.ink;

  return (
    <group>
      <Text
        font={FONT_BOLD}
        fontSize={0.46}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={8.2}
        position={[-3.1, 1.55, 0.35]}
      >
        {title}
      </Text>
      <Text
        font={FONT_REGULAR}
        fontSize={0.25}
        color={palette.inkSoft}
        anchorX="center"
        anchorY="top"
        lineHeight={1.45}
        maxWidth={8.2}
        position={[-3.1, 1.05, 0.35]}
      >
        {body}
      </Text>
    </group>
  );
}

function UnitCube({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  return (
    <RoundedBox args={[0.22 * scale, 0.22 * scale, 0.22 * scale]} radius={0.05} smoothness={3} position={position} castShadow>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
    </RoundedBox>
  );
}

function GroupedBlocks({ relation }: { relation: Extract<ArithmeticRelation, { kind: "addition" | "multiplication" }> }) {
  const groupCount = Number(relation.groups > 8n ? 8n : relation.groups);
  const unitsPerGroup = Number(relation.addend > 12n ? 12n : relation.addend);
  const groupSpacing = 0.86;
  const startX = -3.1 - ((groupCount - 1) * groupSpacing) / 2;
  const hidden = relation.groups > 8n || relation.addend > 12n;

  return (
    <group position={[0, -1.1, 0.45]}>
      {Array.from({ length: groupCount }, (_, groupIndex) => {
        const groupX = startX + groupIndex * groupSpacing;

        return (
          <group key={groupIndex} position={[groupX, 0, 0]}>
            <RoundedBox args={[0.72, 1.05, 0.08]} radius={0.15} smoothness={3} position={[0, -0.02, -0.08]}>
              <meshStandardMaterial color={groupIndex % 2 === 0 ? "#fff6cf" : "#e7f7ff"} />
            </RoundedBox>
            {Array.from({ length: unitsPerGroup }, (_, unitIndex) => {
              const x = -0.24 + (unitIndex % 3) * 0.24;
              const y = 0.33 - Math.floor(unitIndex / 3) * 0.24;
              const z = 0.05 + (unitIndex % 2) * 0.04;

              return (
                <UnitCube
                  key={unitIndex}
                  position={[x, y, z]}
                  color={groupIndex % 2 === 0 ? palette.orange : palette.blue}
                />
              );
            })}
          </group>
        );
      })}
      {hidden && (
        <Text
          font={FONT_BOLD}
          fontSize={0.28}
          color={palette.purpleText}
          anchorX="center"
          anchorY="middle"
          position={[-3.1, -0.92, 0.2]}
        >
          보이는 블록만 일부 표시했어요
        </Text>
      )}
    </group>
  );
}

function ArithmeticOperations3D({ relation }: { relation: ArithmeticRelation }) {
  if (relation.kind === "empty") {
    return (
      <group>
        <TextPanel3D
          title="반복되는 계산을 입체 블록으로"
          body={"3 + 3 + 3처럼 같은 수가 반복되면 같은 크기의 묶음이 생깁니다.\n4 × 5 같은 곱셈은 여러 묶음의 전체 개수로 볼 수 있어요."}
        />
        <group position={[-3.1, -1.35, 0.45]}>
          {[0, 1, 2].map((groupIndex) => (
            <group key={groupIndex} position={[-1.1 + groupIndex * 1.1, 0, 0]}>
              {[0, 1, 2].map((unitIndex) => (
                <UnitCube
                  key={unitIndex}
                  position={[-0.24 + unitIndex * 0.24, Math.sin(unitIndex) * 0.05, 0.05]}
                  color={[palette.red, palette.orange, palette.green][groupIndex]}
                  scale={1.2}
                />
              ))}
            </group>
          ))}
        </group>
      </group>
    );
  }

  if (relation.kind === "unsupported") {
    return <TextPanel3D title="아직 묶기 어려운 식이에요" body={relation.message} tone="warn" />;
  }

  return (
    <group>
      <TextPanel3D
        title={relation.kind === "addition" ? "반복 덧셈이 묶였어요" : "곱셈이 묶음으로 펼쳐졌어요"}
        body={`${relation.additionExpression}\n${relation.multiplicationExpression} = ${formatBigIntText(relation.total)}`}
        tone="good"
      />
      <GroupedBlocks relation={relation} />
      <Text
        font={FONT_BOLD}
        fontSize={0.3}
        color={palette.ink}
        anchorX="center"
        anchorY="middle"
        position={[-3.1, -2.75, 0.5]}
      >
        전체는 {formatBigIntText(relation.total)}개
      </Text>
    </group>
  );
}

function SubtractionBlocks({ relation }: { relation: Extract<SubtractionRelation, { kind: "subtraction" | "division" }> }) {
  const startCubes = getVisibleUnitSticks(relation.start).slice(0, 20);
  const remainderCubes = getVisibleUnitSticks(relation.remainder).slice(0, 20);
  const removedGroups = Number(relation.count > 5n ? 5n : relation.count);
  const removedUnits = Number(relation.subtrahend > 5n ? 5n : relation.subtrahend);

  return (
    <group position={[-3.1, -1.25, 0.45]}>
      <Text font={FONT_BOLD} fontSize={0.18} color={palette.blue} anchorX="center" anchorY="middle" position={[0, 1.05, 0]}>
        처음 수
      </Text>
      {startCubes.map((_, index) => (
        <UnitCube
          key={`start-${index}`}
          position={[-2.35 + (index % 10) * 0.28, 0.65 - Math.floor(index / 10) * 0.28, 0]}
          color={palette.blue}
        />
      ))}

      <Text font={FONT_BOLD} fontSize={0.18} color={palette.redText} anchorX="center" anchorY="middle" position={[0, 0.1, 0]}>
        반복해서 뺀 묶음
      </Text>
      {Array.from({ length: removedGroups }, (_, groupIndex) => (
        <group key={groupIndex} position={[-1.9 + groupIndex * 0.95, -0.35, 0]}>
          <RoundedBox args={[0.78, 0.45, 0.08]} radius={0.12} smoothness={3} position={[0, 0, -0.08]}>
            <meshStandardMaterial color="#ffe2e4" />
          </RoundedBox>
          {Array.from({ length: removedUnits }, (_, unitIndex) => (
            <UnitCube
              key={unitIndex}
              position={[-0.25 + unitIndex * 0.13, 0, 0.05]}
              color={palette.red}
              scale={0.8}
            />
          ))}
        </group>
      ))}

      <Text font={FONT_BOLD} fontSize={0.18} color={palette.greenText} anchorX="center" anchorY="middle" position={[0, -1.05, 0]}>
        남은 수
      </Text>
      {remainderCubes.map((_, index) => (
        <UnitCube
          key={`remain-${index}`}
          position={[-2.35 + (index % 10) * 0.28, -1.45 - Math.floor(index / 10) * 0.28, 0]}
          color={palette.green}
        />
      ))}
    </group>
  );
}

function SubtractionDivision3D({ relation }: { relation: SubtractionRelation }) {
  if (relation.kind === "empty") {
    return (
      <group>
        <TextPanel3D
          title="빼기는 나눗셈의 움직임이에요"
          body={"12 - 3 - 3 - 3처럼 같은 수를 반복해서 빼면 몇 번 뺐는지가 몫이 됩니다.\n13 ÷ 4처럼 딱 떨어지지 않을 때는 나머지도 함께 남아요."}
        />
        <group position={[-3.1, -1.35, 0.45]}>
          {[0, 1, 2, 3].map((groupIndex) => (
            <group key={groupIndex} position={[-1.35 + groupIndex * 0.9, 0, 0]}>
              {[0, 1, 2].map((unitIndex) => (
                <UnitCube key={unitIndex} position={[-0.18 + unitIndex * 0.18, 0, 0]} color={palette.blue} />
              ))}
            </group>
          ))}
        </group>
      </group>
    );
  }

  if (relation.kind === "unsupported") {
    return <TextPanel3D title="아직 나누기 어려운 식이에요" body={relation.message} tone="warn" />;
  }

  return (
    <group>
      <TextPanel3D
        title={relation.kind === "subtraction" ? "반복 뺄셈이 나눗셈이 되었어요" : "나눗셈을 반복 뺄셈으로 보았어요"}
        body={`${relation.subtractionExpression}\n${relation.divisionExpression} = ${formatBigIntText(relation.count)}${
          relation.remainder > 0n ? ` ... ${formatBigIntText(relation.remainder)}` : ""
        }`}
        tone="good"
      />
      <SubtractionBlocks relation={relation} />
      <Text
        font={FONT_REGULAR}
        fontSize={0.2}
        color={palette.inkSoft}
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
        position={[-3.1, -3.05, 0.5]}
      >
        {relation.isComplete ? "더 뺄 수 없을 만큼 작아졌습니다." : "아직 같은 수를 더 뺄 수 있습니다."}
      </Text>
    </group>
  );
}

function PrimeCube({ mood }: { mood: "neutral" | "wrong" | "correct" }) {
  const ref = useRef<THREE.Group>(null);
  const color = mood === "correct" ? palette.green : mood === "wrong" ? palette.red : palette.pink;

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }

    const t = clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.8) * 0.18;
    ref.current.position.y = Math.sin(t * 2.3) * 0.08;

    if (mood === "correct") {
      ref.current.rotation.y += t * 0.35;
      ref.current.position.y += Math.abs(Math.sin(t * 4)) * 0.12;
    }

    if (mood === "wrong") {
      ref.current.position.x = Math.sin(t * 30) * 0.05;
    } else {
      ref.current.position.x = 0;
    }
  });

  return (
    <group ref={ref} position={[-5.75, -0.35, 0.75]}>
      <RoundedBox args={[1.75, 1.75, 1.75]} radius={0.28} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
      </RoundedBox>
      <Text font={FONT_BOLD} fontSize={1.1} color="#ffffff" anchorX="center" anchorY="middle" position={[0, 0, 0.9]}>
        1
      </Text>
      <Text font={FONT_BOLD} fontSize={0.18} color={palette.ink} anchorX="center" anchorY="middle" position={[0, -1.25, 0.2]}>
        약수 탐색 큐브
      </Text>
    </group>
  );
}

function PrimeCompositeQuiz3DPanel() {
  const quiz = primeCompositeQuizzes[0];
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null);
  const [tested, setTested] = useState<Record<number, DivisorOutcome>>({});
  const [feedback, setFeedback] = useState<string>(quiz.hint);
  const isSolved = choiceIndex !== null && quiz.choices[choiceIndex]?.isCorrect;
  const isWrong = choiceIndex !== null && !quiz.choices[choiceIndex]?.isCorrect;
  const mood = isSolved ? "correct" : isWrong ? "wrong" : "neutral";
  const foundCount = Object.values(tested).filter((outcome) => outcome === "found").length;

  function testDivisor(divisor: number) {
    const result = divisorFeedback[divisor];
    setTested((current) => ({ ...current, [divisor]: result.outcome }));
    setFeedback(result.text);
  }

  return (
    <group>
      <PrimeCube mood={mood} />
      <Text
        font={FONT_BOLD}
        fontSize={0.44}
        color={palette.ink}
        anchorX="left"
        anchorY="middle"
        maxWidth={5.2}
        position={[-3.95, 2.0, 0.45]}
      >
        {quiz.question}
      </Text>
      <Text
        font={FONT_REGULAR}
        fontSize={0.22}
        color={palette.inkSoft}
        anchorX="left"
        anchorY="top"
        lineHeight={1.45}
        maxWidth={5.6}
        position={[-3.95, 1.55, 0.45]}
      >
        {isSolved ? quiz.explanation : feedback}
      </Text>

      <Text font={FONT_BOLD} fontSize={0.2} color={palette.purpleText} anchorX="left" anchorY="middle" position={[-3.95, 0.22, 0.45]}>
        찾은 약수 {foundCount}개
      </Text>
      {[1, 2, 3].map((divisor, index) => {
        const outcome = tested[divisor];

        return (
          <Button3D
            key={divisor}
            label={`÷ ${divisor}${outcome === "found" ? " O" : outcome === "not" ? " X" : ""}`}
            width={1.3}
            height={0.62}
            radius={0.28}
            color={[palette.green, palette.blue, palette.orange][index]}
            shadowColor={[palette.greenShadow, palette.blueShadow, palette.orangeShadow][index]}
            textColor={index === 2 ? palette.ink : "#ffffff"}
            fontSize={0.2}
            position={[-3.3 + index * 1.55, -0.3, 0.45]}
            onClick={() => testDivisor(divisor)}
          />
        );
      })}

      {quiz.choices.map((choice, index) => {
        const selected = choiceIndex === index;

        return (
          <Button3D
            key={choice.label}
            label={choice.label}
            width={2.4}
            height={0.78}
            radius={0.28}
            color={choice.isCorrect ? palette.green : palette.red}
            shadowColor={choice.isCorrect ? palette.greenShadow : palette.redShadow}
            textColor="#ffffff"
            fontSize={0.21}
            selected={selected}
            position={[-3.2 + index * 2.75, -1.65, 0.45]}
            onClick={() => {
              setChoiceIndex(index);
              setFeedback(choice.isCorrect ? quiz.explanation : "소수의 약수 개수를 다시 살펴봅시다.");
            }}
          />
        );
      })}

      <RoundedBox args={[4.4, 0.12, 0.12]} radius={0.06} smoothness={2} position={[-2.52, -2.65, 0.25]}>
        <meshStandardMaterial color={isSolved ? palette.green : palette.cardShadow} />
      </RoundedBox>
    </group>
  );
}

function SubunitPlaceholder3D({ unit, selectedSubunit }: { unit: CurriculumUnit; selectedSubunit: string }) {
  return (
    <group>
      <TextPanel3D
        title={selectedSubunit}
        body={`${unit.title} 안에서 다루는 개념입니다.\n목차와 입력 패드는 3D 공간 안에서 유지되고, 활동 화면은 단원별로 확장할 수 있게 구성했습니다.`}
      />
      <group position={[-3.1, -1.4, 0.45]}>
        {[0, 1, 2, 3, 4].map((index) => (
          <group key={index} position={[-1.6 + index * 0.8, Math.sin(index) * 0.12, 0]}>
            <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.12} smoothness={4} castShadow>
              <meshStandardMaterial color={[palette.red, palette.orange, palette.green, palette.blue, palette.purple][index]} />
            </RoundedBox>
            <Text font={FONT_BOLD} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle" position={[0, 0, 0.27]}>
              {index + 1}
            </Text>
          </group>
        ))}
      </group>
    </group>
  );
}

function StageContent({
  selectedStandaloneSection,
  selectedArithmeticTopic,
  selectedGrade,
  selectedSemester,
  selectedUnit,
  selectedSubunit,
  arithmeticRelation,
  subtractionRelation,
  onSelectStandaloneSection,
  onSelectArithmeticTopic,
  onSelectGrade,
  onSelectSemester,
  onSelectUnit,
  onSelectSubunit,
}: {
  selectedStandaloneSection: StandaloneSection | null;
  selectedArithmeticTopic: ArithmeticTopic | null;
  selectedGrade: CurriculumGrade | null;
  selectedSemester: CurriculumSemester | null;
  selectedUnit: CurriculumUnit | null;
  selectedSubunit: string | null;
  arithmeticRelation: ArithmeticRelation;
  subtractionRelation: SubtractionRelation;
  onSelectStandaloneSection: (section: StandaloneSection) => void;
  onSelectArithmeticTopic: (topic: ArithmeticTopic) => void;
  onSelectGrade: (gradeId: CurriculumGrade["id"]) => void;
  onSelectSemester: (semesterId: CurriculumSemester["id"]) => void;
  onSelectUnit: (unitId: string) => void;
  onSelectSubunit: (subunit: string) => void;
}) {
  if (!selectedStandaloneSection && !selectedGrade) {
    const items: ChoiceGridItem[] = [
      {
        key: "arithmetic",
        badgeLabel: "+×",
        badgeColor: palette.orange,
        badgeTextColor: palette.ink,
        title: "사칙연산",
        subtitle: "계산식을 블록 묶음과 입체 패턴으로 전환합니다.",
        onClick: () => onSelectStandaloneSection("arithmetic"),
      },
      ...curriculum.map((grade, index) => ({
        key: grade.id,
        badgeLabel: grade.label,
        badgeColor: gradeColors[index],
        badgeTextColor: gradeTextColors[index],
        title: grade.label,
        subtitle: grade.subtitle,
        onClick: () => onSelectGrade(grade.id),
      })),
    ];

    return <ChoiceGrid3D items={items} columns={2} />;
  }

  if (selectedStandaloneSection === "arithmetic" && !selectedArithmeticTopic) {
    return (
      <ChoiceGrid3D
        items={topicCards.map((item) => ({
          ...item,
          onClick: () => onSelectArithmeticTopic(item.key as ArithmeticTopic),
        }))}
        columns={2}
      />
    );
  }

  if (selectedArithmeticTopic === "addition-multiplication") {
    return <ArithmeticOperations3D relation={arithmeticRelation} />;
  }

  if (selectedArithmeticTopic === "subtraction-division") {
    return <SubtractionDivision3D relation={subtractionRelation} />;
  }

  if (selectedGrade && !selectedSemester) {
    return (
      <ChoiceGrid3D
        items={selectedGrade.semesters.map((semester, index) => ({
          key: semester.id,
          badgeLabel: `${index + 1}`,
          badgeColor: index === 0 ? palette.red : palette.blue,
          title: semester.label,
          subtitle: `대단원 ${semester.units.length}개`,
          onClick: () => onSelectSemester(semester.id),
        }))}
        columns={2}
      />
    );
  }

  if (selectedSemester && !selectedUnit) {
    return (
      <ChoiceGrid3D
        items={selectedSemester.units.map((unit, index) => ({
          key: unit.id,
          badgeLabel: `${index + 1}`,
          badgeColor: palette.purple,
          title: unit.title,
          subtitle: unit.subunits.slice(0, 3).join(" / "),
          onClick: () => onSelectUnit(unit.id),
        }))}
        columns={2}
      />
    );
  }

  if (selectedUnit && !selectedSubunit) {
    return (
      <ChoiceGrid3D
        items={selectedUnit.subunits.map((subunit, index) => ({
          key: subunit,
          badgeLabel: `${index + 1}`,
          badgeColor: index % 2 === 0 ? palette.green : palette.orange,
          badgeTextColor: index % 2 === 0 ? "#ffffff" : palette.ink,
          title: subunit,
          subtitle: `${selectedUnit.title}의 ${index + 1}번째 활동`,
          onClick: () => onSelectSubunit(subunit),
        }))}
        columns={2}
      />
    );
  }

  if (selectedUnit && selectedSubunit === "소수와 합성수") {
    return <PrimeCompositeQuiz3DPanel />;
  }

  if (selectedUnit && selectedSubunit) {
    return <SubunitPlaceholder3D unit={selectedUnit} selectedSubunit={selectedSubunit} />;
  }

  return null;
}

function GameScene({
  expressionTokens,
  preview,
  showApply,
  applyLabel,
  canApply,
  selectedStandaloneSection,
  selectedArithmeticTopic,
  selectedGrade,
  selectedSemester,
  selectedUnit,
  selectedSubunit,
  arithmeticRelation,
  subtractionRelation,
  title,
  breadcrumb,
  showBack,
  onBack,
  onApply,
  onPadKeyDown,
  onPadKeyUp,
  onClear,
  onSelectStandaloneSection,
  onSelectArithmeticTopic,
  onSelectGrade,
  onSelectSemester,
  onSelectUnit,
  onSelectSubunit,
}: {
  expressionTokens: ReturnType<typeof getExpressionDisplayTokens>;
  preview: string;
  showApply: boolean;
  applyLabel: string;
  canApply: boolean;
  selectedStandaloneSection: StandaloneSection | null;
  selectedArithmeticTopic: ArithmeticTopic | null;
  selectedGrade: CurriculumGrade | null;
  selectedSemester: CurriculumSemester | null;
  selectedUnit: CurriculumUnit | null;
  selectedSubunit: string | null;
  arithmeticRelation: ArithmeticRelation;
  subtractionRelation: SubtractionRelation;
  title: string;
  breadcrumb: string;
  showBack: boolean;
  onBack: () => void;
  onApply: () => void;
  onPadKeyDown: (value: string) => void;
  onPadKeyUp: () => void;
  onClear: () => void;
  onSelectStandaloneSection: (section: StandaloneSection) => void;
  onSelectArithmeticTopic: (topic: ArithmeticTopic) => void;
  onSelectGrade: (gradeId: CurriculumGrade["id"]) => void;
  onSelectSemester: (semesterId: CurriculumSemester["id"]) => void;
  onSelectUnit: (unitId: string) => void;
  onSelectSubunit: (subunit: string) => void;
}) {
  return (
    <>
      <SceneCamera />
      <SceneDebugStats />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 8]} intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={["#ffffff", "#d8cff0", 0.8]} />
      <mesh position={[0, 0, 1]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <Backdrop />
      <BoardSurfaces />
      <HeaderBar3D title={title} breadcrumb={breadcrumb} showBack={showBack} onBack={onBack} />
      <StageContent
        selectedStandaloneSection={selectedStandaloneSection}
        selectedArithmeticTopic={selectedArithmeticTopic}
        selectedGrade={selectedGrade}
        selectedSemester={selectedSemester}
        selectedUnit={selectedUnit}
        selectedSubunit={selectedSubunit}
        arithmeticRelation={arithmeticRelation}
        subtractionRelation={subtractionRelation}
        onSelectStandaloneSection={onSelectStandaloneSection}
        onSelectArithmeticTopic={onSelectArithmeticTopic}
        onSelectGrade={onSelectGrade}
        onSelectSemester={onSelectSemester}
        onSelectUnit={onSelectUnit}
        onSelectSubunit={onSelectSubunit}
      />
      <ExpressionTray3D
        tokens={expressionTokens}
        preview={preview}
        showApply={showApply}
        applyLabel={applyLabel}
        canApply={canApply}
        onApply={onApply}
      />
      <NumberPad3D onKeyDown={onPadKeyDown} onKeyUp={onPadKeyUp} onClear={onClear} />
    </>
  );
}

export default function MathGame3D() {
  const [isMounted, setIsMounted] = useState(false);
  const [expression, setExpression] = useState("");
  const [activeArithmeticExpression, setActiveArithmeticExpression] = useState("");
  const [activeSubtractionExpression, setActiveSubtractionExpression] = useState("");
  const [selectedStandaloneSection, setSelectedStandaloneSection] = useState<StandaloneSection | null>(null);
  const [selectedArithmeticTopic, setSelectedArithmeticTopic] = useState<ArithmeticTopic | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<CurriculumGrade["id"] | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<CurriculumSemester["id"] | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedSubunit, setSelectedSubunit] = useState<string | null>(null);
  const repeatTimeoutRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  const selectedGrade = useMemo(
    () => curriculum.find((grade) => grade.id === selectedGradeId) ?? null,
    [selectedGradeId],
  );
  const selectedSemester = useMemo(
    () => getSelectedSemester(selectedGrade, selectedSemesterId),
    [selectedGrade, selectedSemesterId],
  );
  const selectedUnit = useMemo(
    () => getSelectedUnit(selectedSemester, selectedUnitId),
    [selectedSemester, selectedUnitId],
  );
  const expressionTokens = useMemo(() => getExpressionDisplayTokens(expression), [expression]);
  const preview = useMemo(() => getExpressionPreview(expression), [expression]);
  const arithmeticRelation = useMemo(
    () => getArithmeticRelation(activeArithmeticExpression),
    [activeArithmeticExpression],
  );
  const subtractionRelation = useMemo(
    () => getSubtractionDivisionRelation(activeSubtractionExpression),
    [activeSubtractionExpression],
  );
  const showApply = selectedArithmeticTopic !== null;
  const applyLabel = selectedArithmeticTopic === "subtraction-division" ? "보기" : "보기";
  const canApply = expression.trim().length > 0 && selectedArithmeticTopic !== null;
  const showBack = Boolean(
    selectedStandaloneSection ||
      selectedArithmeticTopic ||
      selectedGrade ||
      selectedSemester ||
      selectedUnit ||
      selectedSubunit,
  );
  const title = getTitle({
    selectedStandaloneSection,
    selectedArithmeticTopic,
    selectedGrade,
    selectedSemester,
    selectedUnit,
    selectedSubunit,
  });
  const breadcrumb = getBreadcrumb({
    selectedStandaloneSection,
    selectedArithmeticTopic,
    selectedGrade,
    selectedSemester,
    selectedUnit,
    selectedSubunit,
  });

  const stopRepeatPress = useCallback(() => {
    clearWindowTimer(repeatTimeoutRef.current);
    clearWindowTimer(repeatIntervalRef.current);
    repeatTimeoutRef.current = null;
    repeatIntervalRef.current = null;
  }, []);

  const addToken = useCallback((value: string) => {
    setExpression((current) => (current.length >= 28 ? current : `${current}${value}`));
  }, []);

  const removeToken = useCallback(() => {
    setExpression((current) => current.slice(0, -1));
  }, []);

  const clearExpression = useCallback(() => {
    stopRepeatPress();
    setExpression("");
  }, [stopRepeatPress]);

  const startRepeatPress = useCallback(
    (action: () => void, interval: number) => {
      stopRepeatPress();
      action();
      repeatTimeoutRef.current = window.setTimeout(() => {
        repeatIntervalRef.current = window.setInterval(action, interval);
      }, buttonRepeatDelay);
    },
    [stopRepeatPress],
  );

  const handlePadKeyDown = useCallback(
    (value: string) => {
      if (value === "DEL") {
        startRepeatPress(removeToken, deleteRepeatInterval);
        return;
      }

      startRepeatPress(() => addToken(value), inputRepeatInterval);
    },
    [addToken, removeToken, startRepeatPress],
  );

  const applyExpressionToCurrentSection = useCallback(() => {
    if (!selectedArithmeticTopic || !expression.trim()) {
      return;
    }

    if (selectedArithmeticTopic === "addition-multiplication") {
      setActiveArithmeticExpression(expression);
      return;
    }

    setActiveSubtractionExpression(expression);
  }, [expression, selectedArithmeticTopic]);

  const resetCurriculumSelection = useCallback(() => {
    setSelectedGradeId(null);
    setSelectedSemesterId(null);
    setSelectedUnitId(null);
    setSelectedSubunit(null);
  }, []);

  const resetArithmeticSelection = useCallback(() => {
    setSelectedStandaloneSection(null);
    setSelectedArithmeticTopic(null);
  }, []);

  const selectStandaloneSection = useCallback(
    (section: StandaloneSection) => {
      resetCurriculumSelection();
      setSelectedStandaloneSection(section);
      setSelectedArithmeticTopic(null);
    },
    [resetCurriculumSelection],
  );

  const selectArithmeticTopic = useCallback((topic: ArithmeticTopic) => {
    setSelectedArithmeticTopic(topic);
  }, []);

  const selectGrade = useCallback(
    (gradeId: CurriculumGrade["id"]) => {
      resetArithmeticSelection();
      setSelectedGradeId(gradeId);
      setSelectedSemesterId(null);
      setSelectedUnitId(null);
      setSelectedSubunit(null);
    },
    [resetArithmeticSelection],
  );

  const selectSemester = useCallback((semesterId: CurriculumSemester["id"]) => {
    setSelectedSemesterId(semesterId);
    setSelectedUnitId(null);
    setSelectedSubunit(null);
  }, []);

  const selectUnit = useCallback((unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedSubunit(null);
  }, []);

  const goBack = useCallback(() => {
    if (selectedSubunit) {
      setSelectedSubunit(null);
      return;
    }

    if (selectedUnit) {
      setSelectedUnitId(null);
      return;
    }

    if (selectedSemester) {
      setSelectedSemesterId(null);
      return;
    }

    if (selectedGrade) {
      setSelectedGradeId(null);
      return;
    }

    if (selectedArithmeticTopic) {
      setSelectedArithmeticTopic(null);
      return;
    }

    if (selectedStandaloneSection) {
      setSelectedStandaloneSection(null);
    }
  }, [selectedArithmeticTopic, selectedGrade, selectedSemester, selectedStandaloneSection, selectedSubunit, selectedUnit]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => stopRepeatPress, [stopRepeatPress]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        removeToken();
        return;
      }

      if (event.key === "Escape") {
        if (expression) {
          clearExpression();
        } else {
          goBack();
        }
        return;
      }

      if (event.key === "Enter") {
        applyExpressionToCurrentSection();
        return;
      }

      const token = getKeyboardExpressionToken(event.key, event.code);

      if (token) {
        event.preventDefault();
        addToken(token);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [addToken, applyExpressionToCurrentSection, clearExpression, expression, goBack, removeToken]);

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-[#fff7ea]"
      style={{ width: "100vw", height: "100vh" }}
    >
      {isMounted ? (
        <Suspense fallback={<div className="fixed inset-0 bg-[#fff7ea]" />}>
          <Canvas
            className="mathgame-canvas"
            frameloop="always"
            shadows
            dpr={[1, 2]}
            camera={{ fov: 42, position: [0, 0, 12], near: 0.1, far: 80 }}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
          >
            <color attach="background" args={[palette.backdrop]} />
            <Suspense fallback={null}>
              <GameScene
                expressionTokens={expressionTokens}
                preview={preview}
                showApply={showApply}
                applyLabel={applyLabel}
                canApply={canApply}
                selectedStandaloneSection={selectedStandaloneSection}
                selectedArithmeticTopic={selectedArithmeticTopic}
                selectedGrade={selectedGrade}
                selectedSemester={selectedSemester}
                selectedUnit={selectedUnit}
                selectedSubunit={selectedSubunit}
                arithmeticRelation={arithmeticRelation}
                subtractionRelation={subtractionRelation}
                title={title}
                breadcrumb={breadcrumb}
                showBack={showBack}
                onBack={goBack}
                onApply={applyExpressionToCurrentSection}
                onPadKeyDown={handlePadKeyDown}
                onPadKeyUp={stopRepeatPress}
                onClear={clearExpression}
                onSelectStandaloneSection={selectStandaloneSection}
                onSelectArithmeticTopic={selectArithmeticTopic}
                onSelectGrade={selectGrade}
                onSelectSemester={selectSemester}
                onSelectUnit={selectUnit}
                onSelectSubunit={setSelectedSubunit}
              />
            </Suspense>
          </Canvas>
        </Suspense>
      ) : (
        <div className="fixed inset-0 bg-[#fff7ea]" />
      )}
      <div className="sr-only" aria-live="polite">
        {title}. {breadcrumb}. {preview}
      </div>
    </main>
  );
}
