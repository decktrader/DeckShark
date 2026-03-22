import type { User } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function ProfileCard({ user }: { user: User }) {
  const initials = user.username.slice(0, 2).toUpperCase()
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.username} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          {user.city && user.province && (
            <p className="text-muted-foreground text-sm">
              {user.city}, {user.province}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.bio && <p>{user.bio}</p>}
        <Separator />
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Trades</span>
            <p className="font-medium">{user.completed_trades}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Rating</span>
            <p className="font-medium">
              {user.completed_trades > 0
                ? `${Number(user.trade_rating).toFixed(1)} / 5`
                : 'No ratings yet'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Joined</span>
            <p className="font-medium">{joinedDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
