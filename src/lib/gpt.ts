import { GoogleGenerativeAI } from "@google/generative-ai";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: { [key: string]: any },
  default_category: string = "",
  output_value_only: boolean = false,
  temperature: number = 1,
  num_tries: number = 6, // Increased from 5 to 6 for more resilience
  verbose: boolean = false
) {
  // if the user input is in a list, we also process the output as a list of json
  const list_input = Array.isArray(user_prompt);
  // if the output format contains dynamic elements of < or >, then add to the prompt to handle dynamic elements
  const dynamic_elements = /<.*?>/.test(JSON.stringify(output_format));
  // if the output format contains list elements of [ or ], then we add to the prompt to handle lists
  const list_output = /\[.*?\]/.test(JSON.stringify(output_format));

  // start off with no error message
  let error_msg = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt = `\nYou are to output ${
      list_output && "an array of objects in"
    } the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    // if output_format contains dynamic elements, process it accordingly
    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    // if input is in a list format, ask it to generate json in a list
    if (list_input) {
      output_format_prompt += `\nGenerate an array of json, one json for each input element.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const full_prompt =
      system_prompt +
      output_format_prompt +
      error_msg +
      "\n\n" +
      user_prompt.toString();

    const result = await model.generateContent(full_prompt);
    const response = result.response;
    let res = response.text();

    // Gemini may wrap the JSON in ```json ... ```, so we extract it.
    const jsonMatch = res.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      res = jsonMatch[1];
    }

    // ensure that we don't replace away apostrophes in text
    res = res.replace(/(\w)"(\w)/g, "$1'$2");

    if (verbose) {
      console.log("System prompt:", system_prompt + output_format_prompt + error_msg);
      console.log("\nUser prompt:", user_prompt);
      console.log("\nGPT response:", res);
    }

    // try-catch block to ensure output format is adhered to
    try {
      let output = JSON.parse(res);

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error("Output format not in an array of json");
        }
      } else {
        output = [output];
      }

      // check for each element in the output_list, the format is correctly adhered to
      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          // unable to ensure accuracy of dynamic output header, so skip it
          if (/<.*?>/.test(key)) {
            continue;
          }

          // if output field missing, raise an error
          if (!(key in output[index])) {
            throw new Error(`${key} not in json output`);
          }

          // check that one of the choices given for the list of words is an unknown
          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            // ensure output is not a list
            if (Array.isArray(output[index][key])) {
              output[index][key] = output[index][key][0];
            }
            // output the default category (if any) if GPT is unable to identify the category
            if (!choices.includes(output[index][key]) && default_category) {
              output[index][key] = default_category;
            }
            // if the output is a description format, get only the label
            if (output[index][key].includes(":")) {
              output[index][key] = output[index][key].split(":")[0];
            }
          }
        }

        // if we just want the values for the outputs
        if (output_value_only) {
          output[index] = Object.values(output[index]);
          // just output without the list if there is only one element
          if (output[index].length === 1) {
            output[index] = output[index][0];
          }
        }
      }

      return list_input ? output : output[0];
    } catch (e) {
      // Log the error for debugging
      error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
      console.error(
        `An exception occurred on attempt ${i + 1}.`,
        e
      );
      console.error("Current invalid json format: ", res);

      // If we're not on the last try, wait before retrying
      if (i < num_tries - 1) {
        // Use exponential backoff with jitter to wait before the next attempt
        // Increased base wait time to 3 seconds
        const wait_time = 3000 * 2 ** i + Math.random() * 1000; // Start with ~3s, then ~6s, ~12s, etc.
        console.log(`Attempt ${i + 1}/${num_tries} failed. Retrying in ${Math.round(wait_time / 1000)}s...`);
        await delay(wait_time);
      }
    }
  }

  // If all retries fail, throw an error to be handled by the calling API route
  throw new Error(
    `Failed to get a valid response from the AI after ${num_tries} attempts. ${error_msg}`
  );
}
