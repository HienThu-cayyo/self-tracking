# Forms

Use native form controls and React state for a small form with no schema validation, cross-field rules, or reusable field state. Use React Hook Form when a form has multiple fields, schema validation, field arrays, or meaningful dirty, submitting, and error states.

## Setup

Zod is already installed in `apps/web`. When the first feature needs a complex form, add React Hook Form and its schema adapter to the web workspace:

```bash
pnpm --filter @smart-base/web add react-hook-form @hookform/resolvers
```

Do not add another form library alongside React Hook Form. Use Zod for the form schema and `zodResolver` to connect validation to React Hook Form.

## Ownership and validation

- Keep a form, its submit handler, and feature-specific schema in the owning feature, for example `apps/web/src/_features/<action>/ui/` and `apps/web/src/_features/<action>/model/`.
- Move a schema to an entity only when multiple features share the same domain contract. Keep API response schemas with the entity or API contract that owns them.
- Render fields with the shared `Label`, `Input`, `Button`, and `Field` primitives from `apps/web/src/_shared/ui/`.
- A client-side resolver provides fast feedback; it does not enforce security. Parse and validate submitted input again in the Server Action or route handler before performing a write.
- Keep database access and secrets on the server. Do not submit client-only validation results as proof that data is trusted.

## Example

The form belongs in a feature-owned Client Component. Pass it a server action or feature mutation as `saveProfile`; keep authorization and server-side parsing in that action.

```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/_shared/ui/button"
import { Input } from "@/_shared/ui/input"
import { Label } from "@/_shared/ui/label"

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a display name."),
  email: z.string().email("Enter a valid email address."),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfileForm({
  saveProfile,
}: {
  saveProfile: (values: ProfileFormValues) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: "", email: "" },
  })

  return (
    <form onSubmit={handleSubmit(saveProfile)} noValidate>
      <div>
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? "display-name-error" : undefined}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p id="display-name-error" role="alert">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          type="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "profile-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="profile-email-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  )
}
```

For controlled components that do not expose a standard input ref and change handler, use React Hook Form's `Controller` or `useController`. Keep labels, invalid state, and error text connected with `htmlFor`, `aria-invalid`, and `aria-describedby`.

See the official [React Hook Form integration guide](https://react-hook-form.com/integrations) and [Zod resolver example](https://github.com/react-hook-form/documentation/blob/master/src/content/integrations/zod.mdx).
