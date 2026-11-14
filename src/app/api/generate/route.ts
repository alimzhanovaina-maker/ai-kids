import OpenAI from "openai";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
const prompts:Record<string,string>={
 game:"Создай оригинальную дидактическую игру для дошкольников. Обязательно: название, цель, материалы, подготовка, правила, ход игры, 3 уровня сложности и вопросы воспитателя.",
 story:"Напиши оригинальную добрую сказку для дошкольников. Добавь короткие эпизоды, повторяющиеся фразы, понятный сюжет, вопросы на понимание и творческое задание.",
 illustration:"Подготовь подробное техническое задание для создания оригинальной детской иллюстрации: композиция, персонажи, палитра, фон, стиль, требования к печати. Не утверждай, что изображение уже создано.",
 cards:"Разработай набор карточек для печати: перечень карточек, точные подписи, идеи изображений, правила сортировки и рекомендации по макету А4.",
 worksheet:"Создай рабочий лист для дошкольника: 4-6 коротких заданий, инструкции ребёнку, ответы/подсказки воспитателю и рекомендации по печати.",
 lesson:"Подготовь краткосрочный план занятия на 25 минут: тема, цель, задачи, материалы, этапы с примерным временем, речь воспитателя, задания и рефлексия.",
 author:"Разработай авторскую методическую идею: актуальность, цель, задачи, новизна, целевая группа, материалы, этапы, правила, примеры заданий, оценка процесса и рекомендации."
};
export async function POST(req:Request){
 try{
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Войди в аккаунт, чтобы создавать материалы."},{status:401});
  const body=await req.json();const {type,topic,age="4 года",language="both",format="Цветной, для детей"}=body;
  if(!prompts[type]||typeof topic!=="string"||!topic.trim())return NextResponse.json({error:"Проверь тип материала и тему."},{status:400});
  const {data:quotaData,error:quotaError}=await supabase.rpc("consume_generation");
  if(quotaError)return NextResponse.json({error:"Не удалось проверить лимит аккаунта."},{status:500});
  const quota=quotaData?.[0];
  if(!quota?.allowed)return NextResponse.json({error:"Лимит бесплатного тарифа исчерпан. Попробуй в следующем месяце или перейди на PRO."},{status:429});
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"AI-сервис ещё не подключён. Администратору нужно добавить OPENAI_API_KEY."},{status:503});
  const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const languageRule=language==="ru"?"Пиши на русском языке.":language==="kz"?"Қазақ тілінде жаз.":"Сделай полноценную версию на русском, затем отдельную версию на грамотном казахском языке.";
  const response=await openai.chat.completions.create({model:process.env.OPENAI_MODEL||"gpt-4.1-mini",messages:[
   {role:"system",content:"Ты — методист дошкольного образования. Создавай оригинальные, безопасные, возрастосообразные материалы для детей. Не используй сложные инструкции и мелкие детали. Не заявляй о достижениях ребёнка после одного занятия; используй формулировки процесса: учится, пробует, закрепляет, дағдыланады."},
   {role:"user",content:`${prompts[type]}\nТема: ${topic}\nВозраст: ${age}\nФормат: ${format}\n${languageRule}\nУчитывай, что это материал для воспитателя детского сада.`}
  ],temperature:0.8});
  const content=response.choices[0]?.message?.content||"Не удалось получить ответ.";
  return NextResponse.json({content,remaining:quota.remaining});
 }catch(e){console.error(e);return NextResponse.json({error:"Внутренняя ошибка генерации."},{status:500});}
}
