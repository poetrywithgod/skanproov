-- SKANPROOV: generate_codes returns one value instead of one row per code.
--
-- The Supabase API cuts a function's list of rows at 1,000 by default, so a run of 10,000 codes would
-- come back with only the first 1,000 and the rest would be lost for good (only hashes are kept).
-- The same codes returned as one JSON value are not cut. The row-by-row function becomes an internal
-- helper that the API cannot call.
--
-- Result: {"run_id": "...", "run_no": 128, "codes": [{"t": "<16-character token>", "p": "<12-digit PIN>"}, ...]}

alter function public.generate_codes(uuid, integer) rename to generate_code_rows;
revoke execute on function public.generate_code_rows(uuid, integer) from public, anon, authenticated;

create function public.generate_codes(p_batch uuid, p_quantity integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  select jsonb_build_object(
           'run_id', r.run_id, 'run_no', r.run_no,
           'codes', jsonb_agg(jsonb_build_object('t', r.token, 'p', r.pin))
         )
    into v
    from public.generate_code_rows(p_batch, p_quantity) r
   group by r.run_id, r.run_no;
  return v;
end;
$$;

revoke execute on function public.generate_codes(uuid, integer) from public, anon;
grant execute on function public.generate_codes(uuid, integer) to authenticated;
