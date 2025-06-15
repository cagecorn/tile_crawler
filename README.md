# tile_crawler
타일 크롤러

이 게임은 한 번 만들다가 실패하고 처음부터 [canvas] 기반으로 다시 만든다.
따라서 대부분의 로직은 (old)machanics.js에 담겨 있다.
해당 파일을 참고만 할 뿐, 실제로 적용하진 말 것.


This project is a browser-based dungeon crawler. It lets players explore levels, battle enemies and gather loot directly in the browser.
포켓몬스터처럼 적을 죽이고 자신의 편으로 만드는 재미가 있다.

## Playing

Open `index.html` in a modern web browser to start the game. 

## 시스템 매니저

이 게임은 매우 복잡한 로직이 필요하기 때문에 코드의 경제성을 위해서 여러가지 시스템 매니저를 코드로 구현한다.(패치하며 매니저를 더하고 뺄 것임))

-총괄 매니저(전체적인 틀) :현재 층의 오라 버프, 지도 버프, 여러 속성등을 관리하고 단계적으로 배치, 기억, 계산한다.
-이벤트 매니저 : 모든 유닛의 트리거 매니저.
-버프 매니저 : 모든 유닛의 버프 카운트.
-디버프 매니저 : 모든 유닛의 디버프 카운트.
-오라 매니저 : 모든 유닛의 오라 카운트.
-지형지물 매니저(맵형성) : 다양한 맵 환경을 조성하고 알고리즘을 짠다.
-시각효과 매니저 : 현재 유닛들의 도트 이미지 위나 아래에 입힐 효과를 짠다.
-오브젝트 매니저 : 현재 층에 배치될 여러가지 오브젝트를 구현, 계산한다.
-전투로그 매니저(순서, 중복) : 각종 전투 메시지를 편집 관리한다.
-전투 외적 카운트 매니저 : 전투 외적으로 카운트될 숫자들을 관리한다.(알의 부화, 호감도, 배부름, 농사사 카운트 등)
-타일 매니저 : 유닛이 장비한 타일을 관리하고, 전체적인 타일 시스템을 관리한다.
-동선 관리 매니저 : 모든 유닛의 동선을 효율적으로 관리, 계산한다.
-이동속도 매니저 : 모든 유닛의 이동 속도에 따른 차등을 계산한다.

### Dungeon Generation
Each floor is carved from a depth-first search maze. Corridors span seven~10 tiles,
and the exit is placed on a randomly chosen cell that the algorithm visited.

## 스킬 풀

각 유닛은 각자의 카테고리에 맞는 스킬을 랜덤으로 스킬풀에서 가져온다.

-용병 스킬
-몬스터 스킬
-오라 스킬
-버프 스킬
-디버프 스킬

## 유닛의 종류
- 용병 : 용병 스킬 풀에서 한 개의 스킬을 랜덤으로 가져온다.
- 몬스터 : 몬스터 '특성'이라는 몬스터 고유의 일반 공격 능력과 몬스터 '스킬'을 가져온다.
- 엘리트 몬스터 : 특성, 오라를 가져온다.
- 슈페리어 몬스터 : 용병의 스킬 한 개과 오라 스킬 한 개를 가져온다.(스킬 보유 두 개)
- 챔피언 몬스터 : 용병의 형상을 하고 몬스터 특성, 몬스터 스킬을 가져온다.
- 성기사 : 고유 용병. 버프 스킬 한 개와 용병 스킬 한 개를 가져온다.
- 다크나이트 : 고유 몬스터. 디버프 스킬 한 개와 몬스터 스킬 한 개를 가져온다.
- 


### Monster Progression

As you descend the dungeon, tougher monsters appear on each floor.

- **Floors 1-2** – Goblins, Goblin Archers, Goblin Wizards and Zombies.
- **Floors 3-4** – Skeletons, Skeleton Mages and Orcs (with Orc Archers).
- **Floors 5-6** – Trolls begin to appear alongside Orcs and Skeleton Mages.
- **Floors 7-8** – Dark Mages join the mix with Trolls and Orcs.
- **Floors 9-10** – Demon Warriors lead groups of Dark Mages and Orcs.
- **Beyond floor 10** – ELEMENTAL_GOLEM and other high-level foes may appear.


- **SLIME** – A weak blob that slowly slides toward the player.
- **KOBOLD** – Crafty scavenger that often attacks in packs.
- **GARGOYLE** – Stone guardian with tough defenses.
- **BANSHEE** – Ethereal spirit whose wail saps life.
- **MINOTAUR** – Brutish beast that charges headfirst.
- **LICH** – Undead sorcerer capable of strong magic.
- **DRAGON_WHELP** – Young dragon with a small but fiery breath.
- **ELEMENTAL_GOLEM** – Massive construct empowered by elemental forces.

### Controls

- Use the arrow keys or on-screen arrows to move your character.
- Press `Z` (or `F`) or click **Attack** to strike the nearest monster.
- Number keys `1`-`9` open the details of each hired mercenary.
- Use the BGM buttons at the top of the page to switch tracks or mute the background music.
- Additional actions such as **Heal**, **Recall**, **Skill1** and **Skill2** are available via the action buttons. You can also use `X` for **Skill1**, `C` for **Skill2**, `V` for **Ranged** attack and `A` to recall your mercenaries.

### Audio

The game uses the Web Audio API for sound effects and plays background music through the `bgm-player` element.
At the top of the page are three BGM controls:
- **prev-bgm** – play the previous track
- **toggle-bgm** – mute or unmute music
- **next-bgm** – play the next track

Audio is not initialized until you interact with the page. The first click or key press runs `initializeAudio()` which starts the sound engine and begins playback.
When tests run under jsdom, audio initialization is skipped so no sound plays.

### Hiring Mercenaries

Click the buttons in the *Hire Mercenary* panel to recruit warriors, archers, healers or wizards, bard. Each mercenary costs gold and appears near the player. You may have up to five mercenaries at a time; when full you will be prompted to replace an existing ally.

### Shop and Skill System

Spend collected gold in the shop to purchase items. Bought gear is placed in your inventory and can boost your stats when equipped.
When defining skills, include a numeric `cooldown` property. Passive or always-available skills should set it to `0`.

### Mercenary Skills

Each mercenary receives one random skill upon hiring. Using that skill costs the
mercenary's mana, and the skill's name and icon show up in the combat log when
activated. You can see the assigned skill and its mana cost in the mercenary's
detail panel and in the side list by their portrait. Open a mercenary's detail
panel with the corresponding number key (`1`-`9`) or by clicking their portrait
in the UI.

### Bard Mercenaries

Bards are support units that join with songs ready to boost the party. Each bard
comes with one of two skill sets:

- **Heal** + **Guardian Hymn**
- **Heal** + **Courage Hymn**

These hymns play `auraActivateMinor` or `auraActivateMajor` sound cues when
activated, letting you know their protective or offensive effects are in play.


### Mercenary Traits

차후 구현 가능성 있음.

### Mercenary Affinity (호감도 시스템)

Mercenaries and revived monsters track an *affinity* value that measures their
loyalty to the party.

- Newly hired mercenaries start with **50** affinity.
- Revived monsters start with **30** affinity.
- Affinity rises by **0.01** each turn a unit stays in your party and caps at **200**.
- When a mercenary dies they lose **5** affinity. If their affinity drops to zero
  they permanently leave your party.

You can view a unit's current affinity by opening their detail window. The value
appears near the top of the stats panel.

#### Food and Cooking

Food items increase affinity. Simple drops like **Bread** provide small bonuses
(+3 affinity), while cooked dishes from the **Crafting** tab grant larger
amounts. For example, combining Bread, Meat and Lettuce into a **Sandwich** yields
**+3** affinity and fullness.

Ingredient items and cooking recipes drop randomly during exploration and are
stored as crafting materials rather than in your main inventory.

### Elite Monsters and Auras

Each dungeon floor now contains at least one **elite** monster. Elites boast higher stats and randomly receive an aura skill that benefits nearby allies. When an elite is revived as a mercenary, it keeps this aura skill. Elites display a red glow and the "엘리트" prefix. Champions glow yellow, and superior monsters glow blue.

#### Superior Rank

Superior elites are a planned upgrade to normal elites. They carry two aura skills and gain strength through a star-based system. They are not yet part of the regular dungeon spawns.

### Incubators

Incubators let you hatch monster eggs into powerful allies. Place an egg from your inventory into an empty slot to start the process. Each egg shows how many turns remain until hatching. At the start of every turn the counter decreases. When an egg reaches zero, the hatched superior is moved to the waiting list. Recruit them from there to add the new mercenary to your party.


### Loot

Recipe scrolls may drop from monsters or appear in dungeons. Picking one up automatically adds the recipe to your known list. Duplicate scrolls are ignored once learned.

### Monster Farming

You can now cultivate monsters for equipment. Bury a defeated foe on a farm tile to start growing loot. The monster slowly decomposes over a set number of turns. Using fertilizer items reduces this time or improves the drop quality. When the growth is complete, harvest the plot to receive equipment influenced by the planted monster.

### Equipment Enhancement

Gear can be leveled up using materials like **iron** and **bone**. Each enhancement level adds **+1** to attack and defense, **+0.5** to other non-resistance stats, and **+0.01** to resistance stats. Press the **강화** button beside an item in your inventory to spend the materials and apply the upgrade. Players now begin the game with **100** iron and **100** bone so you can enhance equipment right away.
Each attempt has a 20% chance to fail, which still consumes the materials but does not increase the item's level.

### Disassembling Gear

Equipment can be broken down for extra materials. Click the **분해** button next to a weapon, armor or accessory to dismantle it. You gain both **iron** and **bone** equal to the item's base level plus its enhancement level. The item is removed from your inventory after disassembly.


### Leeching and Vampirism Bonuses

Some equipment suffixes grant special `killHealth` or `killMana` modifiers. Gear with the **Leeching** suffix restores health to whoever lands the killing blow, while the **Vampirism** suffix replenishes mana on a kill. These bonuses provide a steady trickle of recovery as you defeat enemies.

### Special Tiles

Dungeon floors contain several interactive tiles:

- **Treasure Chests** scatter 1–5 random items around them when opened.
- **Mines** grant large amounts of **iron**.
- **Trees** provide plenty of **wood**.
- **Bone Piles** yield lots of **bone**.
- **Temples** come in three colors and either fully heal the party, restore fullness or raise affinity by 10. Each temple disappears after use.
- **Graves** present a risky challenge. Accepting it spawns monsters but rewards high level items, materials and gold.

### Map Items and Altars

Map items occasionally drop from monsters and chests. Each map lists a modifier that alters the next floor, such as boosting treasure or increasing monster spawns. Every five floors a glowing map altar appears in the dungeon. Stand on the altar and activate a map from your inventory to apply its modifier – maps only work when used while positioned on these altars.


## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Pull requests and issues are welcome. Please follow common open source etiquette when proposing changes.
